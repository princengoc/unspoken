import { create } from 'zustand';
import { sessionsTable, exchangesTable } from '../supabase/client';
import type { GameSession, Card, Exchange } from '../supabase/types';
import { supabase } from '../supabase/client';

interface GameState {
  // Session state
  sessionId: string | null;
  loading: boolean;
  initialized: boolean;
  gamePhase: GameSession['current_phase'];
  gameStage: 'dealing' | 'selecting' | 'ready';  // Sub-stages within setup phase
  activePlayerId: string | null;
  players: Array<{
    id: string;
    username: string | null;
    isOnline: boolean;
  }>;
  
  // Local UI state
  isSpeakerSharing: boolean;
  activeReactions: string[];
  isRippled: boolean;
  
  // Card state
  cardsInPlay: Card[];
  discardPile: Card[];
  playerHands: Record<string, Card[]>;
  selectedCards: Record<string, string>;  // playerId -> cardId for setup phase
  
  // Exchange state
  pendingExchanges: Exchange[];
  
  // Actions
  initSession: (userId: string, roomId?: string) => Promise<(() => void) | undefined>;
  joinSession: (sessionId: string, userId: string) => Promise<void>;
  leaveSession: (userId: string) => Promise<void>;
  setGamePhase: (phase: GameSession['current_phase']) => Promise<void>;
  setActivePlayer: (playerId: string) => Promise<void>;
  setSpeakerSharing: (isSharing: boolean) => void;
  toggleReaction: (reaction: string) => void;
  toggleRipple: () => void;
  dealInitialCards: () => Promise<void>;
  selectCardForPool: (playerId: string, cardId: string) => Promise<void>;
  addWildCards: () => Promise<void>;
  startMainPhase: () => Promise<void>;
  proposeExchange: (recipientId: string, offeredCardId: string, requestedCardId: string) => Promise<void>;
  respondToExchange: (exchangeId: string, accept: boolean) => Promise<void>;
}

const fetchCardsByIds = async (cardIds: string[]): Promise<Card[]> => {
  if (!cardIds.length) return [];
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);
    
  if (error) throw error;
  return data as Card[];
};

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  sessionId: null,
  loading: false,
  initialized: false,
  gamePhase: 'setup',
  gameStage: 'dealing',
  activePlayerId: null,
  players: [],
  isSpeakerSharing: false,
  activeReactions: [],
  isRippled: false,
  cardsInPlay: [],
  discardPile: [],
  playerHands: {},
  selectedCards: {},
  pendingExchanges: [],
  
  // Actions
  initSession: async (userId: string, roomId?: string) => {
    try {
      set({ loading: true });
      // First check if room already has a session
      if (roomId) {
        const { data: room } = await supabase
          .from('rooms')
          .select('current_session_id')
          .eq('id', roomId)
          .single();
        
        if (room?.current_session_id) {
          // Join existing session
          const session = await sessionsTable.get(room.current_session_id);
          set({ 
            sessionId: session.id,
            gamePhase: session.current_phase,
            activePlayerId: session.active_player_id,
            players: session.players || [],
            initialized: true
          });
          return;
        }
      }

      // Create new session if none exists
      const session = await sessionsTable.create({
        active_player_id: userId,
        room_id: roomId,
        current_phase: 'setup',
        cards_in_play: [],
        discard_pile: [],
        player_hands: {},
        players: [{ id: userId, isOnline: true }]
      });

      // Set up real-time subscription
      const subscription = sessionsTable.subscribeToChanges(session.id, async (updatedSession) => {
        const [cardsInPlay, discardPile] = await Promise.all([
          fetchCardsByIds(updatedSession.cards_in_play || []),
          fetchCardsByIds(updatedSession.discard_pile || [])
        ]);
    
        set({
          gamePhase: updatedSession.current_phase,
          activePlayerId: updatedSession.active_player_id,
          cardsInPlay,
          discardPile,
          players: updatedSession.players || []
        });
      });

      set({ 
        sessionId: session.id,
        activePlayerId: userId,
        gamePhase: 'setup',
        gameStage: 'dealing',
        initialized: true
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize session:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  joinSession: async (sessionId: string, userId: string) => {
    try {
      await sessionsTable.addPlayer(sessionId, userId);
      set({ sessionId });

      // Subscribe to exchanges
      exchangesTable.subscribeToChanges(sessionId, (exchanges) => {
        set({ pendingExchanges: exchanges });
      });
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  },

  leaveSession: async (userId: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      await sessionsTable.removePlayer(sessionId, userId);
      set({ 
        sessionId: null,
        activePlayerId: null,
        players: get().players.filter(p => p.id !== userId)
      });
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  },
  
  setGamePhase: async (phase) => {  
    const { sessionId } = get();
    if (!sessionId) return;
    
    try {
      await sessionsTable.update(sessionId, { current_phase: phase });
      set({ gamePhase: phase });
    } catch (error) {
      console.error('Failed to update phase:', error);
    }
  },

  setActivePlayer: async (playerId) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      await sessionsTable.update(sessionId, { active_player_id: playerId });
      set({ activePlayerId: playerId });
    } catch (error) {
      console.error('Failed to update active player:', error);
    }
  },
  
  setSpeakerSharing: (isSharing) => {
    set({ isSpeakerSharing: isSharing });
  },
  
  toggleReaction: (reaction) => {
    set((state) => ({
      activeReactions: state.activeReactions.includes(reaction)
        ? state.activeReactions.filter(r => r !== reaction)
        : [...state.activeReactions, reaction]
    }));
  },
  
  toggleRipple: () => {
    set((state) => ({ isRippled: !state.isRippled }));
  },

  dealCards: async (sessionId: string, userId: string): Promise<Card[]> => {
    try {
      // First get the session to check the state
      const { data: session, error: sessionError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('Session not found');

      // Get all cards currently in use
      const usedCardIds = [
        ...(session.cards_in_play || []),
        ...(session.discard_pile || []),
        ...Object.values(session.player_hands || {}).flat()
      ];
      
      // Get all available cards first
      const { data: availableCards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .not('id', 'in', usedCardIds.length > 0 ? usedCardIds : ['']);
      
      if (cardsError) throw cardsError;
      if (!availableCards || availableCards.length < 3) {
        throw new Error('Not enough cards available');
      }

      // Randomly select 3 cards from available cards
      const selectedCards = availableCards
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // Update session with the dealt cards for this player
      const newPlayerHands = {
        ...session.player_hands,
        [userId]: selectedCards.map(card => card.id)
      };

      const { error: updateError } = await supabase
        .from('game_sessions')
        .update({ player_hands: newPlayerHands })
        .eq('id', sessionId);

      if (updateError) throw updateError;
      
      return selectedCards as Card[];
    } catch (error) {
      console.error('Error in dealCards:', error);
      throw error;
    }
  },

  dealInitialCards: async () => {
    const { sessionId, players } = get();
    if (!sessionId) {
      console.error('No active session');
      return;
    }
    
    try {
      set({ loading: true });
      
      // Deal cards to each player sequentially to avoid race conditions
      const playerHands: Record<string, Card[]> = {};
      
      for (const player of players) {
        try {
          const cards = await sessionsTable.dealCards(sessionId, player.id);
          playerHands[player.id] = cards;
        } catch (err) {
          console.error(`Failed to deal cards to player ${player.id}:`, err);
          throw new Error(`Failed to deal cards to player ${player.id}`);
        }
      }
      
      set({ 
        playerHands,
        gameStage: 'selecting'
      });
      
    } catch (error) {
      console.error('Failed to deal initial cards:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  selectCardForPool: async (playerId: string, cardId: string) => {
    try {
      set(state => ({
        selectedCards: {
          ...state.selectedCards,
          [playerId]: cardId
        }
      }));
      
      // Check if all players have selected
      const { players, selectedCards } = get();
      const allSelected = players.every(p => selectedCards[p.id]);
      
      if (allSelected) {
        await get().addWildCards();
      }
    } catch (error) {
      console.error('Failed to select card:', error);
      throw error;
    }
  },

  addWildCards: async () => {
    const { sessionId, selectedCards } = get();
    if (!sessionId) return;
    
    try {
      // Get 2 random cards not in any player's hand or selected cards
      const { data: wildCards } = await supabase
        .from('cards')
        .select('*')
        .not('id', 'in', Object.values(selectedCards))
        .order('RANDOM()')
        .limit(2);

      if (!wildCards) throw new Error('Failed to get wild cards');
      
      // Combine selected cards and wild cards
      const allCardsInPlay = [
        ...Object.values(selectedCards),
        ...wildCards.map(c => c.id)
      ];
      
      // Update session with cards in play
      await sessionsTable.update(sessionId, {
        cards_in_play: allCardsInPlay
      });
      
      set({ 
        cardsInPlay: [...Object.values(selectedCards), ...wildCards],
        gameStage: 'ready'
      });
    } catch (error) {
      console.error('Failed to add wild cards:', error);
      throw error;
    }
  },

  startMainPhase: async () => {
    const { sessionId, players } = get();
    if (!sessionId) return;
    
    try {
      // Set first player as active
      await sessionsTable.update(sessionId, {
        current_phase: 'speaking',
        active_player_id: players[0].id
      });
      
      set({ 
        gamePhase: 'speaking',
        activePlayerId: players[0].id
      });
    } catch (error) {
      console.error('Failed to start main phase:', error);
      throw error;
    }
  },
  
  proposeExchange: async (recipientId, offeredCardId, requestedCardId) => {
    const { sessionId, activePlayerId } = get();
    if (!sessionId || !activePlayerId) return;
    
    try {
      const exchange = await exchangesTable.create({
        session_id: sessionId,
        requester_id: activePlayerId,
        recipient_id: recipientId,
        offered_card_id: offeredCardId,
        requested_card_id: requestedCardId,
      });
      
      set((state) => ({
        pendingExchanges: [...state.pendingExchanges, exchange]
      }));
    } catch (error) {
      console.error('Failed to propose exchange:', error);
    }
  },
  
  respondToExchange: async (exchangeId, accept) => {
    try {
      const updatedExchange = await exchangesTable.updateStatus(
        exchangeId, 
        accept ? 'accepted' : 'rejected'
      );
      
      set((state) => ({
        pendingExchanges: state.pendingExchanges.map(ex => 
          ex.id === exchangeId ? updatedExchange : ex
        )
      }));
    } catch (error) {
      console.error('Failed to respond to exchange:', error);
    }
  }
}));