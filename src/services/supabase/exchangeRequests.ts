import { MatchedExchange } from '@/core/game/types';
import { supabase } from './client';

export type ExchangeRequestStatus = 'pending' | 'accepted' | 'declined';
export type ExchangeRequestDirection = 'incoming' | 'outgoing';

export interface ExchangeRequest {
  id: string;
  room_id: string;
  from_id: string;
  to_id: string;
  card_id: string;
  status: ExchangeRequestStatus;
  created_at: string;
  updated_at: string;
}

export const exchangeRequestsService = {
  async createRequest(
    roomId: string,
    fromId: string,
    toId: string,
    cardId: string
  ): Promise<ExchangeRequest> {
    // Check if a request already exists for this player pair
    const { data: existingRequest } = await supabase
      .from('exchange_requests')
      .select('*')
      .match({ room_id: roomId, from_id: fromId, to_id: toId })
      .single();

    if (existingRequest) {
      // Update existing request with new card
      const { data, error } = await supabase
        .from('exchange_requests')
        .update({ 
          card_id: cardId,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .match({ room_id: roomId, from_id: fromId, to_id: toId })
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new request
      const { data, error } = await supabase
        .from('exchange_requests')
        .insert([{
          room_id: roomId,
          from_id: fromId,
          to_id: toId,
          card_id: cardId,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async updateRequestStatus(
    requestId: string,
    status: ExchangeRequestStatus
  ): Promise<ExchangeRequest> {
    const { data, error } = await supabase
      .from('exchange_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getExchangeRequests(roomId: string, userId: string | null, direction: ExchangeRequestDirection = 'incoming'): Promise<ExchangeRequest[]> {
    const query = supabase
      .from('exchange_requests')
      .select('*')
      .eq('room_id', roomId);

    if (userId !== null) {
      if (direction === 'incoming') {
        query.eq('to_id', userId);
      } else {
        query.eq('from_id', userId);
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getMatchedRequests(roomId: string): Promise<MatchedExchange[]> {
    const { data, error } = await supabase.rpc('get_matched_exchange_requests', { room_id_param: roomId });

    if (error) throw error;
    return data || [];
  },

  // Fixed subscription to exchange requests changes
  subscribeToExchangeRequests(roomId: string, userId: string, callback: (outgoing: ExchangeRequest[], incoming: ExchangeRequest[]) => void) {
    return supabase
      .channel(`exchange_requests:${roomId}:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'exchange_requests',
          filter: `room_id=eq.${roomId}`,
        }, 
        async () => {
          try {
            // Get both outgoing and incoming requests in parallel
            const [outgoing, incoming] = await Promise.all([
              this.getExchangeRequests(roomId, userId, 'outgoing'),
              this.getExchangeRequests(roomId, userId, 'incoming')
            ]);
            
            callback(outgoing, incoming);
          } catch (error) {
            console.error('Error fetching exchange requests:', error);
          }
        }
      )
      .subscribe();
  }
};