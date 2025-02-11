import { supabase } from './client';
import type { CardHistory } from '@/core/game/types';

export const cardHistoryService = {
  async recordCardAnswer(
    userId: string,
    cardId: string,
    gameSessionId: string,
    roundNumber: number
  ): Promise<CardHistory> {
    const { data, error } = await supabase
      .from('card_history')
      .insert([{
        user_id: userId,
        card_id: cardId,
        game_session_id: gameSessionId,
        round_number: roundNumber
      }])
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to record card history');
    
    return {
      id: data.id,
      userId: data.user_id,
      cardId: data.card_id,
      gameSessionId: data.game_session_id,
      roundNumber: data.round_number,
      answeredAt: data.answered_at
    };
  },

  async getUserCardHistory(userId: string): Promise<CardHistory[]> {
    const { data, error } = await supabase
      .from('card_history')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(record => ({
      id: record.id,
      userId: record.user_id,
      cardId: record.card_id,
      gameSessionId: record.game_session_id,
      roundNumber: record.round_number,
      answeredAt: record.answered_at
    }));
  },

  async getSessionCardHistory(gameSessionId: string): Promise<CardHistory[]> {
    const { data, error } = await supabase
      .from('card_history')
      .select('*')
      .eq('game_session_id', gameSessionId)
      .order('answered_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(record => ({
      id: record.id,
      userId: record.user_id,
      cardId: record.card_id,
      gameSessionId: record.game_session_id,
      roundNumber: record.round_number,
      answeredAt: record.answered_at
    }));
  }
};