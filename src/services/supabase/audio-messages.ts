import { AudioMessage, AudioPrivacy } from '@/core/audio/types';
import { supabase } from './client'; // Adjust path as needed

// Storage bucket for audio messages
const AUDIO_BUCKET = 'audio-messages';

/**
 * Upload an audio blob to Supabase storage
 */
export const uploadAudioMessage = async (
  roomId: string,
  userId: string,
  audioBlob: Blob,
  privacy: AudioPrivacy
): Promise<AudioMessage | null> => {
  try {
    // 1. Generate a unique filename
    // Using roomId as the folder name for RLS policies
    const timestamp = Date.now();
    const filePath = `${roomId}/${userId}_${timestamp}.webm`;
    
    // 2. Upload the audio file to Supabase storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filePath, audioBlob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
      });
    
    if (storageError) {
      console.error('Error uploading audio:', storageError);
      return null;
    }
    
    // 3. Calculate expiration time (24 hours from now)
    // This is a safety mechanism in case message isn't properly deleted
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // 4. Create a database record for the audio message
    const { data: messageData, error: messageError } = await supabase
      .from('audio_messages')
      .insert({
        room_id: roomId,
        sender_id: userId,
        file_path: filePath,
        is_public: privacy === 'public',
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single();
    
    if (messageError) {
      console.error('Error creating audio message record:', messageError);
      // Clean up the uploaded file
      await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);
      return null;
    }
    
    console.log('Inserted message data:', messageData);
    
    if (messageError) {
      console.error('Error creating audio message record:', messageError);
      // Clean up the uploaded file
      await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);
      return null;
    }
    
    // 5. Format and return the message
    return {
      id: messageData.id,
      roomId: messageData.room_id,
      senderId: messageData.sender_id,
      filePath: messageData.file_path,
      isPublic: messageData.is_public,
      createdAt: messageData.created_at,
      expiresAt: messageData.expires_at,
    };
  } catch (error) {
    console.error('Error in uploadAudioMessage:', error);
    return null;
  }
};

/**
 * Get available audio messages for a user in a room
 */
export const getAvailableAudioMessages = async (
    roomId: string,
    userId: string
  ): Promise<AudioMessage[]> => {
    try {
      console.log('Fetching messages for room:', roomId, 'user:', userId);
      
      // Get room information to determine if user is the active player
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('active_player_id')
        .eq('id', roomId)
        .single();
      
      if (roomError) {
        console.error('Error fetching room data:', roomError);
        return [];
      }
      
      console.log('Room data:', roomData);
      const isActivePlayer = roomData.active_player_id === userId;
      console.log('Is active player:', isActivePlayer);
      
      // Direct query to get all messages for this room, regardless of access
      // This is simpler and makes debugging easier
      const { data: messages, error: messagesError } = await supabase
        .from('audio_messages')
        .select(`
          id,
          room_id,
          sender_id,
          file_path,
          is_public,
          created_at,
          expires_at
        `)
        .eq('room_id', roomId)
        .gt('expires_at', new Date().toISOString());
      
      console.log('Raw messages from DB:', messages);
      
      if (messagesError) {
        console.error('Error fetching audio messages:', messagesError);
        return [];
      }
      
      // Filter messages based on privacy settings
      let filteredMessages = messages;
      if (!isActivePlayer) {
        // If not active player, only show public messages
        filteredMessages = messages.filter(msg => msg.is_public);
      }
      
      console.log('Messages after privacy filter:', filteredMessages);
      
      // Get list of messages the user has already accessed
      const { data: accessedMessages, error: accessError } = await supabase
        .from('audio_message_access')
        .select('message_id')
        .eq('user_id', userId);
      
      if (accessError) {
        console.error('Error fetching accessed messages:', accessError);
        return [];
      }
      
      console.log('Already accessed messages:', accessedMessages);
      
      const accessedIds = new Set(accessedMessages?.map(a => a.message_id) || []);
      
      // Filter out messages the user has already accessed
      const availableMessages = filteredMessages
        .filter(msg => !accessedIds.has(msg.id))
        .map(msg => ({
          id: msg.id,
          roomId: msg.room_id,
          senderId: msg.sender_id,
          filePath: msg.file_path,
          isPublic: msg.is_public,
          createdAt: msg.created_at,
          expiresAt: msg.expires_at,
        }));
      
      console.log('Final available messages:', availableMessages);
      
      return availableMessages;
    } catch (error) {
      console.error('Error in getAvailableAudioMessages:', error);
      return [];
    }
  };

/**
 * Get a signed URL to access the audio file
 */
export const getAudioMessageUrl = async (
  messageId: string,
  filePath: string,
  userId: string
): Promise<{ url: string; expiresIn: number } | null> => {
  try {
    console.log('Getting audio URL for message:', messageId, 'filePath:', filePath);
    
    // Get a signed URL that expires in 5 minutes
    const expiresIn = 60 * 5; // 5 minutes in seconds
    const { data: urlData, error: urlError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(filePath, expiresIn);
    
    console.log('Signed URL result:', urlData, urlError);
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      
      // Fallback to public URL if signed URL fails
      const { data: publicUrlData } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(filePath);
      
      console.log('Falling back to public URL:', publicUrlData);
      
      if (publicUrlData && publicUrlData.publicUrl) {
        return {
          url: publicUrlData.publicUrl,
          expiresIn: 300, // 5 minutes
        };
      }
      
      return null;
    }
    
    return {
      url: urlData.signedUrl,
      expiresIn,
    };
  } catch (error) {
    console.error('Error in getAudioMessageUrl:', error);
    return null;
  }
};

/**
 * Mark that a user has listened to a message
 * This should be called only after the user has actually played the message
 */
export const markMessageAsListened = async (
  messageId: string,
  userId: string
): Promise<boolean> => {
  try {
    console.log('Marking message as listened:', messageId, 'by user:', userId);
    
    // Check if the user has already accessed this message
    const { data: existingAccess } = await supabase
      .from('audio_message_access')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();
    
    // Only insert if no existing access record
    if (!existingAccess) {
      // Record that the user has accessed this message
      const { error: accessError } = await supabase
        .from('audio_message_access')
        .insert({
          message_id: messageId,
          user_id: userId,
        });
      
      if (accessError) {
        console.error('Error recording message access:', accessError);
        return false;
      }
    }
    
    // Check if all intended recipients have now accessed the message
    await checkAndCleanupMessage(messageId);
    
    return true;
  } catch (error) {
    console.error('Error in markMessageAsListened:', error);
    return false;
  }
};
export const checkAndCleanupMessage = async (messageId: string): Promise<void> => {
  try {
    // 1. Get the message details
    const { data: messageData, error: messageError } = await supabase
      .from('audio_messages')
      .select(`
        id,
        room_id,
        file_path,
        is_public
      `)
      .eq('id', messageId)
      .single();
    
    if (messageError) {
      console.error('Error fetching message details:', messageError);
      return;
    }
    
    // 2. Determine who should have access
    let requiredListeners: string[] = [];
    
    if (messageData.is_public) {
      // For public messages, all room members should listen
      const { data: roomMembers, error: membersError } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', messageData.room_id);
      
      if (membersError) {
        console.error('Error fetching room members:', membersError);
        return;
      }
      
      requiredListeners = roomMembers.map(m => m.user_id);
    } else {
      // For private messages, only the active player should listen
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('active_player_id')
        .eq('id', messageData.room_id)
        .single();
      
      if (roomError) {
        console.error('Error fetching room data:', roomError);
        return;
      }
      
      requiredListeners = [roomData.active_player_id];
    }
    
    // 3. Get list of users who have accessed the message
    const { data: accesses, error: accessError } = await supabase
      .from('audio_message_access')
      .select('user_id')
      .eq('message_id', messageId);
    
    if (accessError) {
      console.error('Error fetching message accesses:', accessError);
      return;
    }
    
    const accessedUsers = new Set(accesses.map(a => a.user_id));
    
    // 4. Check if all required listeners have accessed the message
    const allListenersAccessed = requiredListeners.every(userId => accessedUsers.has(userId));
    
    if (allListenersAccessed) {
      // 5. Delete the message and its file
      await supabase.storage.from(AUDIO_BUCKET).remove([messageData.file_path]);
      
      await supabase
        .from('audio_messages')
        .delete()
        .eq('id', messageId);
      
      console.log(`Audio message ${messageId} has been fully accessed and deleted.`);
    }
  } catch (error) {
    console.error('Error in checkAndCleanupMessage:', error);
  }
};