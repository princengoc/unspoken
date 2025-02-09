import { createClient } from '@supabase/supabase-js';
import type { Card, GameSession, Exchange } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for game sessions
export const sessionsTable = {
  async create(initialData: Partial<GameSession>) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([initialData])
      .select()
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  async get(sessionId: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  async addPlayer(sessionId: string, userId: string) {
    // First get current players
    const session = await this.get(sessionId);
    const currentPlayers = session.players || [];
    
    const { error } = await supabase
      .from('game_sessions')
      .update({
        players: [...currentPlayers, { id: userId, isOnline: true }]
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  async removePlayer(sessionId: string, userId: string) {
    const session = await this.get(sessionId);
    const updatedPlayers = (session.players || []).filter(p => p.id !== userId);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  async dealCards(sessionId: string, userId: string): Promise<Card[]> {
    // First get the session to check the state
    const session = await this.get(sessionId);
    
    // Get undelt cards (not in any player's hand or in play)
    const { data: availableCards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .not('id', 'in', [
        ...(session.cards_in_play || []),
        ...(session.discard_pile || [])
      ])
      .order('RANDOM()')
      .limit(3);
    
    if (cardsError) throw cardsError;
    
    if (!availableCards) {
      throw new Error('No cards available to deal');
    }

    // Update session with the dealt cards for this player
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        [`player_hands`]: {
          ...session.player_hands,
          [userId]: availableCards.map(card => card.id)
        }
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;
    
    return availableCards as Card[];
  },

  // Subscribe to changes in a game session
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

// Helper functions for exchanges
export const exchangesTable = {
  async create(exchange: Omit<Exchange, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('exchanges')
      .insert([{ ...exchange, status: 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Exchange;
  },

  async updateStatus(exchangeId: string, status: Exchange['status']) {
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
          // When any exchange changes, fetch all exchanges for the session
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