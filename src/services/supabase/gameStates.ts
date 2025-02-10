import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import { supabase } from './client';
import { GameState, Card, Exchange } from '@/core/game/types';

// Helper functions for database conversion
export const toCardIds = (cards: Card[]): string[] => cards.map(card => card.id);

const fromDatabaseSession = async (dbSession: any): Promise<Partial<GameState>> => {
  // Fetch full card objects for all card IDs
  const allCardIds = [
    ...(dbSession.cards_in_play || []),
    ...(dbSession.discard_pile || []),
    ...Object.values(dbSession.player_hands || {}).flat()
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

  // Create lookup for efficient card finding
  const cardMap = new Map(cards.map(card => [card.id, card]));

  // Convert card IDs to Card objects
  const cardsInPlay = (dbSession.cards_in_play || [])
  .map((id: string) => cardMap.get(id))
  .filter(Boolean) as Card[];

  const discardPile = (dbSession.discard_pile || [])
  .map((id: string) => cardMap.get(id))
  .filter(Boolean) as Card[];

  const playerHands: Record<string, Card[]> = {};
  Object.entries(dbSession.player_hands || {}).forEach(([playerId, cardIds]) => {
    playerHands[playerId] = (cardIds as string[])
      .map(id => cardMap.get(id))
      .filter(Boolean) as Card[];
  });

  return {
    phase: dbSession.current_phase,
    activePlayerId: dbSession.active_player_id,
    players: dbSession.players,
    cardsInPlay,
    discardPile,
    playerHands,
    isSpeakerSharing: dbSession.is_speaker_sharing || false,
    pendingExchanges: [] // This would be handled by a separate subscription
  };
};

const toDatabaseSession = (state: Partial<GameState>) => ({
  current_phase: state.phase,
  active_player_id: state.activePlayerId,
  players: state.players,
  cards_in_play: state.cardsInPlay ? toCardIds(state.cardsInPlay) : undefined,
  discard_pile: state.discardPile ? toCardIds(state.discardPile) : undefined,
  player_hands: state.playerHands 
    ? Object.fromEntries(
        Object.entries(state.playerHands).map(
          ([playerId, cards]) => [playerId, toCardIds(cards)]
        )
      )
    : undefined,
  is_speaker_sharing: state.isSpeakerSharing
});

export const sessionsService = {
  async create(initialState: Partial<GameState>): Promise<GameState> {
    try {
      if (!initialState.activePlayerId) {
        throw new Error('active_player_id is required');
      }      
      
      if (!initialState.players?.length) {
        throw new Error('At least one player is required');
      }
      
      const dbSession = toDatabaseSession({
        phase: 'setup',
        cardsInPlay: [],
        discardPile: [],
        playerHands: {},
        ...initialState
      });

      const { data, error } = await supabase
        .from('game_sessions')
        .insert([dbSession])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from session creation');

      // Update room with session ID if room_id provided
      if (initialState.room_id) {
        const { error: updateError } = await supabase
          .from('rooms')
          .update({ current_session_id: data.id })
          .eq('id', initialState.room_id);

        if (updateError) throw updateError;
      }      

      return await fromDatabaseSession(data) as GameState;
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  },

  async get(sessionId: string): Promise<GameState> {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Session not found');
    
    return await fromDatabaseSession(data) as GameState;
  },

  async update(sessionId: string, updates: Partial<GameState>): Promise<GameState> {
    const dbUpdates = toDatabaseSession(updates);

    const { data, error } = await supabase
      .from('game_sessions')
      .update(dbUpdates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Session not found');
    
    return await fromDatabaseSession(data) as GameState;
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
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        async (payload) => {
          const state = await fromDatabaseSession(payload.new);
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