// src/hooks/game/useReactions.ts

import { useState, useEffect } from 'react';
import { reactionsService, type ListenerReaction, type ReactionType } from '@/services/supabase/reactions';

interface UseReactionsProps {
  roomId: string;
  speakerId: string;
  listenerId: string;
  cardId: string;
}

export function useReactions({ 
  roomId,
  speakerId,
  listenerId,
  cardId 
}: UseReactionsProps) {
  const [reactions, setReactions] = useState<ListenerReaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Load initial reactions
  useEffect(() => {
    if (!roomId || !listenerId) return;

    const loadReactions = async () => {
      try {
        const data = await reactionsService.getPlayerReactions(roomId, listenerId);
        setReactions(data);
      } catch (error) {
        console.error('Failed to load reactions:', error);
      }
    };

    loadReactions();

    // Subscribe to reaction changes
    const subscription = reactionsService.subscribeToReactions(
      roomId,
      (updatedReactions) => {
        setReactions(updatedReactions);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, listenerId]);

  const toggleReaction = async (type: ReactionType) => {
    if (!roomId || !speakerId || !listenerId || !cardId) return;

    setLoading(true);
    try {
      await reactionsService.toggleReaction(
        roomId,
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
    if (!roomId || !speakerId || !listenerId || !cardId) return;

    setLoading(true);
    try {
      await reactionsService.toggleRipple(
        roomId,
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