import { supabase } from './client';

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
      // Add user to room_members
      const { error: memberError } = await supabase
        .from('room_members')
        .insert([{
          room_id: request.room_id,
          user_id: request.user_id
        }]);

      if (memberError) throw memberError;
    }

    return request;
  },

  async getJoinRequestsForRoom(roomId: string): Promise<JoinroomRequest[]> {
    const { data, error } = await supabase
      .from('joinroom_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('status', 'pending');

    if (error) throw error;
    return data || [];
  },

  async checkJoinRequest(roomId: string, userId: string): Promise<JoinroomRequest | null> {
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
          // Fetch latest requests on any change
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