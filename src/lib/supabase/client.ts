// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Card, GameSession, Exchange } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Typed helper functions for cards
export const cardsTable = {
  async getAll() {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as Card[];
  },

  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('category', category);
    
    if (error) throw error;
    return data as Card[];
  },

  async getByDepth(depth: 1 | 2 | 3) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('depth', depth);
    
    if (error) throw error;
    return data as Card[];
  }
};

// Helper functions for game sessions
export const sessionsTable = {
  async create(userId: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([
        {
          active_player_id: userId,
          current_phase: 'setup',
          cards_in_play: [],
          discard_pile: []
        }
      ])
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
  }
};
