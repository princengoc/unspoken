import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import { supabase } from './client';
import { GameState, Card, Exchange } from '@/core/game/types';

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
  const allCardIds = [
    ...(dbState.cardsInPlay || []),
    ...(dbState.discardPile || []),
    ...Object.values(dbState.playerHands || {}).flat()
  ];

  let cards: Card[] = [];
  if (allCardIds.length > 0) {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('id', allCardIds);
    
    if (error) throw error;
    cards = data;
  }

  const cardMap = new Map(cards.map(card => [card.id, card]));

  // Convert card Ids to Card objects
  const cardsInPlay = (dbState.cardsInPlay || [])
    .map((id: string) => cardMap.get(id))
    .filter(Boolean) as Card[];

  const discardPile = (dbState.discardPile || [])
    .map((id: string) => cardMap.get(id))
    .filter(Boolean) as Card[];

  const playerHands: Record<string, Card[]> = {};
  Object.entries(dbState.playerHands || {}).forEach(([playerId, cardIds]) => {
    playerHands[playerId] = (cardIds as string[])
      .map(id => cardMap.get(id))
      .filter(Boolean) as Card[];
  });

  return {
    id: dbState.id,
    room_id: dbState.room_id,
    phase: dbState.phase,
    activePlayerId: dbState.activePlayerId,
    players: dbState.players,
    cardsInPlay,
    discardPile,
    playerHands,
    isSpeakerSharing: dbState.isSpeakerSharing || false,
    pendingExchanges: []
  };
};

export const gameStatesService = {
  async create(initialState: Omit<GameState, 'id'>): Promise<GameState> {
    try {
      if (!initialState.activePlayerId) {
        throw new Error('activePlayerId is required');
      }      
      
      if (!initialState.players?.length) {
        throw new Error('At least one player is required');
      }

      // Convert Card objects to IDs for database storage
      const dbState = {
        ...initialState,
        cardsInPlay: initialState.cardsInPlay.map(card => card.id),
        discardPile: initialState.discardPile.map(card => card.id),
        playerHands: Object.fromEntries(
          Object.entries(initialState.playerHands)
            .map(([playerId, cards]) => [playerId, cards.map(card => card.id)])
        )
      };
      
      const { data, error } = await supabase
        .from('game_states')
        .insert([dbState])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from state creation');

      // Update room with state ID
      if (initialState.room_id) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ current_session_id: data.id })
          .eq('id', initialState.room_id);

        if (updateError) throw updateError;
      }      

      return await fromDatabaseState(data);
    } catch (error) {
      console.error(`Failed to create game state: ${JSON.stringify(error)}`);
      throw error;
    }
  },

  async get(stateId: string): Promise<GameState> {
    const { data, error } = await supabase
      .from('game_states')
      .select('*')
      .eq('id', stateId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Game state not found');
    
    return await fromDatabaseState(data);
  },

  async update(stateId: string, updates: Partial<GameState>): Promise<GameState> {
    if (updates.cardsInPlay && !updates.cardsInPlay.every(card => typeof card === 'object' && 'id' in card)) {
      throw new Error(`Invalid cardsInPlay: expected array of Card objects. See: ${JSON.stringify(updates.cardsInPlay)}`);
    }

    // Convert Card objects to IDs for database update
    const dbUpdates = {
      ...updates,
      cardsInPlay: updates.cardsInPlay?.map(card => card.id),
      discardPile: updates.discardPile?.map(card => card.id),
      playerHands: updates.playerHands && Object.fromEntries(
        Object.entries(updates.playerHands)
          .map(([playerId, cards]) => [playerId, cards.map(card => card.id)])
      )
    };

    const { data, error } = await supabase
      .from('game_states')
      .update(dbUpdates)
      .eq('id', stateId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Game state not found');
    
    return await fromDatabaseState(data);
  },

  async dealCards(sessionId: string, userId: string): Promise<Card[]> {
    const session = await this.get(sessionId);
    
    const cardsToExclude = [
      ...toCardIds(session.cardsInPlay),
      ...toCardIds(session.discardPile)
    ];
    
    // Get random cards
    const { data: newCards, error: cardsError } = await supabase.rpc(
      'get_random_cards',
      {
        limit_count: INITIAL_CARDS_PER_PLAYER,
        exclude_ids: cardsToExclude,
      }
    );
  
    if (cardsError) throw cardsError;
    if (!newCards) throw new Error('No cards available to deal');
  
    // Update session with the dealt cards
    const updatedHands = {
      ...session.playerHands,
      [userId]: newCards
    };

    await this.update(sessionId, { playerHands: updatedHands });
  
    return newCards;
  },
  
  subscribeToChanges(sessionId: string, callback: (state: GameState) => void) {
    return supabase
      .channel(`game_session:${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_states',
          filter: `id=eq.${sessionId}`
        }, 
        async (payload) => {
          const state = await fromDatabaseState(payload.new);
          callback(state as GameState);
        }
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