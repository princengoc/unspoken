// src/hooks/game/useReactions.ts

import { useState, useEffect } from 'react';
import { reactionsService, type ListenerReaction, type ReactionType } from '@/services/supabase/reactions';

interface UseReactionsProps {
  gameStateId: string;
  speakerId: string;
  listenerId: string;
  cardId: string;
}

export function useReactions({ 
  gameStateId,
  speakerId,
  listenerId,
  cardId 
}: UseReactionsProps) {
  const [reactions, setReactions] = useState<ListenerReaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial reactions
  useEffect(() => {
    if (!gameStateId || !listenerId) return;

    const loadReactions = async () => {
      try {
        const data = await reactionsService.getPlayerReactions(gameStateId, listenerId);
        setReactions(data);
      } catch (error) {
        console.error('Failed to load reactions:', error);
      }
    };

    loadReactions();

    // Subscribe to reaction changes
    const subscription = reactionsService.subscribeToReactions(
      gameStateId,
      (updatedReactions) => {
        setReactions(updatedReactions);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [gameStateId, listenerId]);

  const toggleReaction = async (type: ReactionType) => {
    if (!gameStateId || !speakerId || !listenerId || !cardId) return;

    setLoading(true);
    try {
      await reactionsService.toggleReaction(
        gameStateId,
        speakerId,
        listenerId,
        cardId,
        type
      );
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRipple = async () => {
    if (!gameStateId || !speakerId || !listenerId || !cardId) return;

    setLoading(true);
    try {
      await reactionsService.toggleRipple(
        gameStateId,
        speakerId,
        listenerId,
        cardId
      );
    } catch (error) {
      console.error('Failed to toggle ripple:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if a specific reaction is active
  const hasReaction = (type: ReactionType): boolean => {
    return reactions.some(r => 
      r.type === type && 
      r.speakerId === speakerId && 
      r.cardId === cardId
    );
  };

  // Check if card is rippled
  const isRippled = (): boolean => {
    return reactions.some(r => 
      r.rippleMarked && 
      r.speakerId === speakerId && 
      r.cardId === cardId
    );
  };

  return {
    reactions,
    loading,
    toggleReaction,
    toggleRipple,
    hasReaction,
    isRippled
  };
}