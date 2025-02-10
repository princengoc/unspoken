import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import { supabase } from './client';
import type { GameSession, Card, Exchange } from '@/core/game/types';

export const sessionsService = {
  async create(initialData: Partial<GameSession>): Promise<GameSession> {
    try {
      if (!initialData.active_player_id) {
        throw new Error('active_player_id is required');
      }      
      
      // Ensure we have players array and it's not empty
      if (!initialData.players || initialData.players.length === 0) {
        throw new Error('At least one player is required');
      }
      
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([{
          current_phase: 'setup',
          cards_in_play: [],
          discard_pile: [],
          player_hands: {},
          active_player_id: initialData.active_player_id,
          players: initialData.players,
          ...initialData
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from session creation');

      // Update room with session ID if room_id provided
      if (initialData.room_id) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ current_session_id: data.id })
          .eq('id', initialData.room_id);

        if (updateError) throw updateError;
      }      

      return data as GameSession;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  },

  async get(sessionId: string): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Session not found');
    
    return data as GameSession;
  },

  async update(sessionId: string, updates: Partial<GameSession>): Promise<GameSession> {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Session not found');
    
    return data as GameSession;
  },

  async dealCards(sessionId: string, userId: string): Promise<Card[]> {
    const session = await this.get(sessionId);
    
    // Get undelt cards (not in any player's hand or in play)
    const { data: availableCards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      // .not('id', 'in', [
      //   ...(session.cards_in_play || []),
      //   ...(session.discard_pile || [])
      // ])
      // .order('RANDOM()')
      .limit(INITIAL_CARDS_PER_PLAYER);
    
    if (cardsError) throw cardsError;
    if (!availableCards) throw new Error('No cards available to deal');

    // Update session with the dealt cards for this player
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        player_hands: {
          ...session.player_hands,
          [userId]: availableCards.map(card => card.id)
        }
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;
    
    return availableCards as Card[];
  },

  subscribeToChanges(sessionId: string, callback: (session: GameSession) => void) {
    return supabase
      .channel(`game_session:${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        (payload) => callback(payload.new as GameSession)
      )
      .subscribe();
  }
};

export const exchangesService = {
  async create(exchange: Omit<Exchange, 'id' | 'status'>): Promise<Exchange> {
    const { data, error } = await supabase
      .from('exchanges')
      .insert([{ ...exchange, status: 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Exchange;
  },

  async updateStatus(exchangeId: string, status: Exchange['status']): Promise<Exchange> {
    const { data, error } = await supabase
      .from('exchanges')
      .update({ status })
      .eq('id', exchangeId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Exchange;
  },

  subscribeToChanges(sessionId: string, callback: (exchanges: Exchange[]) => void) {
    return supabase
      .channel(`exchanges:${sessionId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchanges',
          filter: `session_id=eq.${sessionId}`
        },
        async () => {
          const { data } = await supabase
            .from('exchanges')
            .select('*')
            .eq('session_id', sessionId);
          callback(data as Exchange[]);
        }
      )
      .subscribe();
  }
};