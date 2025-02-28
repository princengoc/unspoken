// src/context/ReactionsProvider.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { reactionsService, Reaction, ReactionType } from '@/services/supabase/reactions';

// Define the context type
interface ReactionsContextType {
  // State
  allReactions: Reaction[];
  incomingReactions: Reaction[];
  outgoingReactions: Reaction[];
  loading: boolean;
  
  // Actions
  toggleReaction: (
    toId: string,
    cardId: string,
    type: ReactionType,
    isPrivate?: boolean
  ) => Promise<void>;
  
  toggleRipple: (
    toId: string,
    cardId: string
  ) => Promise<void>;
  
  // Helper functions to check state
  hasReaction: (toId: string, cardId: string, type: ReactionType) => boolean;
  isRippled: (toId: string, cardId: string) => boolean;
  getReactionsToCard: (cardId: string) => Reaction[];
}

// Create context
const ReactionsContext = createContext<ReactionsContextType | null>(null);

// Provider props interface
interface ReactionsProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

export function ReactionsProvider({
  roomId,
  userId,
  children
}: ReactionsProviderProps) {
  const [allReactions, setAllReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calculated values for incoming/outgoing reactions
  const incomingReactions = allReactions.filter(r => r.toId === userId);
  const outgoingReactions = allReactions.filter(r => r.fromId === userId);
  
  // Set up subscription to reactions
  useEffect(() => {
    if (!roomId) return;
    
    const subscription = reactionsService.subscribeToReactions(
      roomId,
      (updatedReactions) => {
        setAllReactions(updatedReactions);
        setLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);
  
  // Action: Toggle a reaction
  // fromId will always be the current userId
  const toggleReaction = async (
    toId: string,
    cardId: string,
    type: ReactionType,
    isPrivate: boolean = true
  ): Promise<void> => {
    try {
      await reactionsService.toggleReaction(
        roomId,
        toId,
        userId,
        cardId,
        type,
        isPrivate
      );
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
      throw error;
    }
  };
  
  // Action: Toggle a ripple
  const toggleRipple = async (
    toId: string,
    cardId: string
  ): Promise<void> => {
    try {
      await reactionsService.toggleRipple(
        roomId,
        toId,
        userId,
        cardId
      );
    } catch (error) {
      console.error('Failed to toggle ripple:', error);
      throw error;
    }
  };
  
  // Helper: Check if the current user has a specific reaction
  const hasReaction = (
    toId: string,
    cardId: string,
    type: ReactionType
  ): boolean => {
    return outgoingReactions.some(
      r => r.toId === toId && r.cardId === cardId && r.type === type
    );
  };
  
  // Helper: Check if the current user has rippled this card
  const isRippled = (
    toId: string,
    cardId: string
  ): boolean => {
    return outgoingReactions.some(
      r => r.toId === toId && r.cardId === cardId && r.rippleMarked
    );
  };
  
  // Helper: Get all reactions to a specific card
  const getReactionsToCard = (cardId: string): Reaction[] => {
    return allReactions.filter(r => r.toId === userId && r.cardId === cardId);
  };
  
  const value = {
    allReactions,
    incomingReactions,
    outgoingReactions,
    loading,
    toggleReaction,
    toggleRipple,
    hasReaction,
    isRippled,
    getReactionsToCard
  };
  
  return (
    <ReactionsContext.Provider value={value}>
      {children}
    </ReactionsContext.Provider>
  );
}

// Hook to use the reactions context
export function useReactions() {
  const context = useContext(ReactionsContext);
  if (!context) {
    throw new Error('useReactions must be used within a ReactionsProvider');
  }
  return context;
}