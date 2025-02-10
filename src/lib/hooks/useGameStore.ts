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
  dealCards: (userId: string) => Promise<void>;
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
  activePlayerId: null,
  players: [],
  isSpeakerSharing: false,
  activeReactions: [],
  isRippled: false,
  cardsInPlay: [],
  discardPile: [],
  playerHands: {},
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
      set({ gamePhase: phase });  // renamed
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

  dealCards: async (userId: string) => {
    const { sessionId } = get();
    if (!sessionId) return;

    try {
      const cards = await sessionsTable.dealCards(sessionId, userId);
      set((state) => ({
        playerHands: {
          ...state.playerHands,
          [userId]: cards
        }
      }));
    } catch (error) {
      console.error('Failed to deal cards:', error);
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