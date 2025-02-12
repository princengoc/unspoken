import { supabase } from './client';
import type { Player, PlayerState } from '@/core/game/types';

// Keep existing JoinRequest types
interface JoinroomRequest {
  id: string;
  room_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  handled_at: string | null;
  handled_by: string | null;
}

export const roomMembersService = {
  // Keep existing join request methods
  async createJoinRequest(roomId: string, userId: string): Promise<JoinroomRequest> {
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

  async handleJoinRequest(
    requestId: string, 
    status: 'approved' | 'rejected', 
    handledBy: string
  ): Promise<JoinroomRequest> {
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
          status: 'choosing',
          hasSpoken: false,
          is_online: true,
          playerHand: []
        }]);

      if (memberError) throw memberError;
    }

    return request;
  },

  // Keep existing join request subscription methods
  async getJoinRequestsForRoom(roomId: string): Promise<JoinroomRequest[]> {
    const { data, error } = await supabase
      .from('joinroom_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  },

  // New methods for player state management
  async getRoomMembers(roomId: string): Promise<Player[]> {
    const { data, error } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return data.map(member => ({
      id: member.user_id,
      username: member.username,
      isOnline: member.is_online,
      status: member.status,
      selectedCard: member.selectedCard,
      hasSpoken: member.hasSpoken,
      speakOrder: member.speakOrder
    }));
  },

  async updatePlayerState(
    roomId: string,
    userId: string,
    updates: Partial<PlayerState>
  ): Promise<void> {
    const { error } = await supabase
      .from('room_members')
      .update(updates)
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async updatePlayerHand(
    roomId: string,
    userId: string,
    cards: any[]
  ): Promise<void> {
    const { error } = await supabase
      .from('room_members')
      .update({ playerHand: cards })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) throw error;
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
  subscribeToJoinRequests(roomId: string, callback: (requests: JoinroomRequest[]) => void) {
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