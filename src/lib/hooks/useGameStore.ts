// src/lib/hooks/useGameStore.ts
import { create } from 'zustand';
import { sessionsTable, exchangesTable } from '../supabase/client';
import type { GameSession, Card, Exchange } from '../supabase/types';

interface GameState {
  // Session state
  sessionId: string | null;
  currentPhase: GameSession['current_phase'];
  activePlayerId: string | null;
  
  // Local UI state
  isSpeakerSharing: boolean;
  activeReactions: string[];
  isRippled: boolean;
  
  // Card state (cached from Supabase)
  cardsInPlay: Card[];
  discardPile: Card[];
  
  // Exchange state
  pendingExchanges: Exchange[];
  
  // Actions
  initSession: (userId: string) => Promise<void>;
  setPhase: (phase: GameSession['current_phase']) => Promise<void>;
  setSpeakerSharing: (isSharing: boolean) => void;
  toggleReaction: (reaction: string) => void;
  toggleRipple: () => void;
  proposeExchange: (recipientId: string, offeredCardId: string, requestedCardId: string) => Promise<void>;
  respondToExchange: (exchangeId: string, accept: boolean) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  sessionId: null,
  currentPhase: 'setup',
  activePlayerId: null,
  isSpeakerSharing: false,
  activeReactions: [],
  isRippled: false,
  cardsInPlay: [],
  discardPile: [],
  pendingExchanges: [],
  
  // Actions
  initSession: async (userId: string) => {
    try {
      const session = await sessionsTable.create(userId);
      
      // Subscribe to session changes
      sessionsTable.subscribeToChanges(session.id, (updatedSession) => {
        set({
          currentPhase: updatedSession.current_phase,
          activePlayerId: updatedSession.active_player_id,
          // Update cards when they change in the session
          cardsInPlay: updatedSession.cards_in_play,
          discardPile: updatedSession.discard_pile,
        });
      });
      
      set({ 
        sessionId: session.id,
        activePlayerId: userId,
      });
    } catch (error) {
      console.error('Failed to initialize session:', error);
    }
  },
  
  setPhase: async (phase) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    try {
      await sessionsTable.update(sessionId, { current_phase: phase });
      set({ currentPhase: phase });
    } catch (error) {
      console.error('Failed to update phase:', error);
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
  
  proposeExchange: async (recipientId, offeredCardId, requestedCardId) => {
    const { sessionId } = get();
    if (!sessionId) return;
    
    try {
      const exchange = await exchangesTable.create({
        session_id: sessionId,
        requester_id: get().activePlayerId!,
        recipient_id: recipientId,
        offered_card_id: offeredCardId,
        requested_card_id: requestedCardId
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