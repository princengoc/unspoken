import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import { supabase } from './client';
import { GameState, Card} from '@/core/game/types';
import { DEFAULT_TOTAL_ROUNDS } from '@/core/game/constants';
import { reactionsService } from './reactions';
import { roomMembersService } from './roomMembers';

// Helper functions for database conversion
const toCardIds = (cards: Card[]): string[] => {
  return Array.from(new Set(cards.map(card => card.id)));
};

export async function fetchCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds.length) return [];
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);
    
  if (error) throw error;
  return data;
}

const fromDatabaseState = async (dbState: any): Promise<GameState> => {
  // Collect all card IDs from the game state (cardsInPlay and discardPile)
  const allCardIds = [
    ...(dbState.cardsInPlay || []),
    ...(dbState.discardPile || [])
  ];

  // Fetch all cards in one go. 
  const cards = await fetchCardsByIds(Array.from(new Set(allCardIds))); 

  // Create a map of card ID to Card object.
  const cardMap = new Map(cards.map(card => [card.id, card]));

  // Convert card IDs to Card objects.
  const cardsInPlay = (dbState.cardsInPlay || [])
    .map((id: string) => cardMap.get(id))
    .filter(Boolean) as Card[];

  const discardPile = (dbState.discardPile || [])
    .map((id: string) => cardMap.get(id))
    .filter(Boolean) as Card[];

  return {
    id: dbState.id,
    room_id: dbState.room_id,
    phase: dbState.phase,
    currentRound: dbState.currentRound,
    totalRounds: dbState.totalRounds,
    activePlayerId: dbState.activePlayerId,
  };
};

export const gameStatesService = {
  async create(initialState: Omit<GameState, 'id'>): Promise<GameState> {
    try {
      const dbState = {
        room_id: initialState.room_id,
        phase: initialState.phase,
        activePlayerId: initialState.activePlayerId,
        currentRound: 1,
        totalRounds: DEFAULT_TOTAL_ROUNDS,
      };
      
      const { data, error } = await supabase
        .from('game_states')
        .insert([dbState])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update room with state ID
      if (initialState.room_id) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ game_state_id: data.id })
          .eq('id', initialState.room_id);

        if (updateError) throw updateError;
      }      

      return await fromDatabaseState(data);
    } catch (error) {
      console.error(`Failed to create game state: ${JSON.stringify(error)}`);
      throw error;
    }
  },

  async get(gameStateId: string): Promise<GameState> {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('id', gameStateId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Game state not found');
    
    return await fromDatabaseState(data);
  },

  async update(gameStateId: string, updates: Partial<GameState>): Promise<GameState> {
    // Convert Card objects to IDs for database update
    const dbUpdates: any = { ...updates };

    const { data, error } = await supabase
      .from('game_states')
      .update(dbUpdates)
      .eq('id', gameStateId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Game state not found');
    
    return await fromDatabaseState(data);
  },
  
  subscribeToChanges(gameStateId: string, callback: (state: GameState) => void) {
    return supabase
      .channel(`game_states:${gameStateId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_states',
          filter: `id=eq.${gameStateId}`
        }, 
        async (payload) => {
          const state = await fromDatabaseState(payload.new);
          callback(state as GameState);
        }
      )
      .subscribe();
  }
};