import { AudioMessage, AudioPrivacy } from '@/core/audio/types';
import { supabase } from './client';

// Storage bucket for audio messages
const AUDIO_BUCKET = 'audio-messages';

export const audioMessagesService = {

  async uploadAudioMessage(
    roomId: string,
    user_id: string,
    audioBlob: Blob,
    privacy: AudioPrivacy
  ): Promise<AudioMessage | null> {
    try {
      // 1. Generate a unique filename
      const timestamp = Date.now();
      const filePath = `${roomId}/${user_id}_${timestamp}.webm`;
      
      // 2. Upload the audio file to Supabase storage
      const { error: storageError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
        });
      
      if (storageError) {
        console.error('Error uploading audio:', storageError);
        return null;
      }
      
      // 3. Create a database record for the audio message
      const { data: messageData, error: messageError } = await supabase
        .from('audio_messages')
        .insert({
          room_id: roomId,
          sender_id: user_id,
          file_path: filePath,
          is_public: privacy === 'public',
          expires_at: null, // expiry will be set by backend codes
        })
        .select('*')
        .single();
      
      if (messageError) {
        console.error('Error creating audio message record:', messageError);
        // Clean up the uploaded file
        await supabase.storage.from(AUDIO_BUCKET).remove([filePath]);
        return null;
      }

      return messageData as AudioMessage; 
    } catch (error) {
      console.error('Error in uploadAudioMessage:', error);
      return null;
    }
  },

  async getAvailableAudioMessages(
    roomId: string,
    user_id: string
  ): Promise<AudioMessage[]> {
    const { data: audioMessages, error } = await supabase.rpc('get_available_audio_messages', {
        p_room_id: roomId,
        p_user_id: user_id,
      });
      
      if (error) {
        console.error('Error fetching available audio messages:', error);
        return [];
      }
      
      return audioMessages as AudioMessage[];
  },

  async getAudioMessageUrl(
    filePath: string,
  ): Promise<{ url: string; expiresIn: number } | null> {
    try {
      // Get a signed URL that expires in 10 minutes
      const expiresIn = 600;
      const { data: urlData, error: urlError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .createSignedUrl(filePath, expiresIn);
      
      if (urlError) {
        console.error('Error creating signed URL:', urlError);
        
        // Fallback to public URL if signed URL fails
        const { data: publicUrlData } = supabase.storage
          .from(AUDIO_BUCKET)
          .getPublicUrl(filePath);
        
        if (publicUrlData && publicUrlData.publicUrl) {
          return {
            url: publicUrlData.publicUrl,
            expiresIn: 600, // 10 minutes
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
  },

  async markMessageAsListened(
    message_id: string,
    user_id: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('mark_message_as_listened', {
      p_message_id: message_id,
      p_user_id: user_id,
    });
  
    if (error) {
      console.error('Error marking message as listened:', error);
      return false;
    }
    
    return data as boolean;
  },
  
  subscribeToAudioMessages(
    roomId: string,
    user_id: string,
    callback: (messages: AudioMessage[]) => void
  ) {
    // Initial load
    this.getAvailableAudioMessages(roomId, user_id).then(callback);

    // Subscribe to changes in audio_messages table
    return supabase
      .channel(`audio_messages:${roomId}:${user_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audio_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const messages = await this.getAvailableAudioMessages(roomId, user_id);
          callback(messages);
        }
      )
      .subscribe();
  }
};