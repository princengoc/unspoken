import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import { supabase } from './client';
import { GameState, Card, Exchange, Player } from '@/core/game/types';
import { PLAYER_STATUS, DEFAULT_TOTAL_ROUNDS } from '@/core/game/constants';
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
  // Collect all card IDs from various state properties
  const allCardIds = [
    ...(dbState.cardsInPlay || []),
    ...(dbState.discardPile || []),
    ...Object.values(dbState.playerHands || {}).flat()
  ];

  // Fetch all cards in one go
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
    currentRound: dbState.currentRound,
    totalRounds: dbState.totalRounds,
    activePlayerId: dbState.activePlayerId,
    players: dbState.players,
    cardsInPlay,
    discardPile,
    playerHands,
    isSpeakerSharing: dbState.isSpeakerSharing || false
  };
};

export const gameStatesService = {
  async create(initialState: Omit<GameState, 'id'>): Promise<GameState> {
    try {
      const dbState = {
        room_id: initialState.room_id,
        phase: initialState.phase,
        activePlayerId: initialState.activePlayerId,
        cardsInPlay: toCardIds(initialState.cardsInPlay),
        discardPile: toCardIds(initialState.discardPile),
        currentRound: 1,
        totalRounds: DEFAULT_TOTAL_ROUNDS,
        isSpeakerSharing: false
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

    // Convert Card arrays to ID arrays
    if (updates.cardsInPlay) {
      dbUpdates.cardsInPlay = toCardIds(updates.cardsInPlay);
    }
    if (updates.discardPile) {
      dbUpdates.discardPile = toCardIds(updates.discardPile);
    }
    if (updates.playerHands) {
      dbUpdates.playerHands = Object.fromEntries(
        Object.entries(updates.playerHands)
          .map(([playerId, cards]) => [playerId, toCardIds(cards)])
      );
    }

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

  async dealCards(gameStateId: string, userId: string): Promise<Card[]> {
    const dbState = await this.get(gameStateId);
    
    const cardsToExclude = [
      ...toCardIds(dbState.cardsInPlay),
      ...toCardIds(dbState.discardPile)
    ];
    
    // Get random cards
    const { data: randomCardsData, error: cardsError } = await supabase.rpc(
      'get_random_cards',
      {
        limit_count: INITIAL_CARDS_PER_PLAYER,
        exclude_ids: cardsToExclude,
      }
    );
  
    if (cardsError) throw cardsError;
    if (!randomCardsData) throw new Error('No cards available to deal');
    const randomCards = randomCardsData as Card[];
  
    // get rippled cards
    const rippledCards = await reactionsService.getRippledCards(gameStateId, userId);    
    const newCards = [...randomCards, ...rippledCards];

    // Update player's hand in room_members
    await roomMembersService.updatePlayerHand(dbState.room_id, userId, newCards);
  
    return newCards;
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

  subscribeToChanges(gameStateId: string, callback: (exchanges: Exchange[]) => void) {
    return supabase
      .channel(`exchanges:${gameStateId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchanges',
          filter: `game_state_id=eq.${gameStateId}`
        },
        async () => {
          const { data } = await supabase
            .from('exchanges')
            .select('*')
            .eq('game_state_id', gameStateId);
          callback(data as Exchange[]);
        }
      )
      .subscribe();
  }
};