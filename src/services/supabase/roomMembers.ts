import { PLAYER_STATUS } from '@/core/game/constants';
import { supabase } from './client';
import { type Player, type JoinRequest, DEFAULT_PLAYER } from '@/core/game/types';

export const roomMembersService = {
  async createJoinRequest(roomId: string, userId: string): Promise<JoinRequest> {
    const { data, error } = await supabase
      .from('joinroom_requests')
      .insert([{
        room_id: roomId,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create join request');
    return data;
  },

  async checkJoinRequest(roomId: string, userId: string): Promise<JoinRequest | null> {
    const { data, error } = await supabase
      .from('joinroom_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
    return data || null;
  },


  async handleJoinRequest(
    requestId: string, 
    status: 'approved' | 'rejected', 
    handledBy: string
  ): Promise<JoinRequest> {
    const { data: request, error: requestError } = await supabase
      .from('joinroom_requests')
      .update({
        status,
        handled_at: new Date().toISOString(),
        handled_by: handledBy
      })
      .eq('id', requestId)
      .select()
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Request not found');

    if (status === 'approved') {
      // Add user to room_members with initial state
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{
          room_id: request.room_id,
          user_id: request.user_id,
          status: PLAYER_STATUS.CHOOSING,
          hasSpoken: false,
          isOnline: true,
        }]);

      if (memberError) throw memberError;
    }

    return request;
  },

  async addNewMember(roomId: string, playerId: string): Promise<void> {
    const { error } = await supabase
    .from('room_members')
    .insert([{
      room_id: roomId,
      user_id: playerId,
      ...DEFAULT_PLAYER
    }]);
  
    if (error) throw error;    
  },

  // Keep existing join request subscription methods
  async getJoinRequestsForRoom(roomId: string): Promise<JoinRequest[]> {
    const { data, error } = await supabase
      .from('joinroom_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  },

  async getRoomMembers(roomId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('room_members')
      .select(`
        user_id,
        isOnline,
        status,
        hasSpoken,
        profiles(username)
      `)
      .eq('room_id', roomId);
  
    if (error) throw error;
  
    return data.map(member => ({
      id: member.user_id,
      username: (member as any).profiles?.username || "Unknown", 
      isOnline: member.isOnline,
      status: member.status,
      hasSpoken: member.hasSpoken,
    }));
  },
  
  async hasRoomMember(roomId: string, playerId: string): Promise<boolean> {
    const { data: existingMember, error: memberError } = await supabase
      .from('room_members')
      .select('room_id, user_id')
      .eq('room_id', roomId)
      .eq('user_id', playerId)
      .single();
  
    if (memberError) {
      if (memberError.code !== 'PGRST116') {
        throw memberError;
      }
      return false; // PGRST116 indicates no record found
    }
  
    return !!existingMember; // Returns true if a member is found
  },  

  async updatePlayerState(
    roomId: string,
    userId: string,
    updates: Partial<Player>
  ): Promise<void> {
    console.log('Updating player state:', { roomId, userId, updates }); // Debug log
    
    // Get current state first
    const { data: currentState } = await supabase
      .from('room_members')
      .select()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    // Merge with current state to prevent overwriting
    const mergedUpdates = {
      ...currentState,
      ...updates,
    };

    const { error } = await supabase
      .from('room_members')
      .update(mergedUpdates)
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating player state:', error);
      throw error;
    }
  }, 

  // Subscription for player state changes
  subscribeToRoomMembers(roomId: string, callback: (players: Player[]) => void) {
    return supabase
      .channel(`room_members:${roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'room_members',
          filter: `room_id=eq.${roomId}`
        }, 
        async () => {
          const players = await this.getRoomMembers(roomId);
          callback(players);
        }
      )
      .subscribe();
  },

  // Keep existing join request subscription
  subscribeToJoinRequests(roomId: string, callback: (requests: JoinRequest[]) => void) {
    return supabase
      .channel(`joinroom_requests:${roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'joinroom_requests',
          filter: `room_id=eq.${roomId}`
        }, 
        async () => {
          const { data } = await supabase
            .from('joinroom_requests')
            .select('*')
            .eq('room_id', roomId)
            .eq('status', 'pending');
          
          callback(data || []);
        }
      )
      .subscribe();
  }
};