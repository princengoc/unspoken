import { useState, useEffect } from "react";
import {
  reactionsService,
  type ListenerReaction,
  type ReactionType,
} from "@/services/supabase/reactions";

interface UseReactionsProps {
  roomId: string;
  speakerId: string;   // The player who owns the card
  listenerId: string;  // Current user doing the reacting
  cardId: string;      // The card being reacted to
}

export function useReactions({
  roomId,
  speakerId,
  listenerId,
  cardId,
}: UseReactionsProps) {
  const [reactions, setReactions] = useState<ListenerReaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial reactions and subscribe to changes
  useEffect(() => {
    if (!roomId || !listenerId) return;

    const loadReactions = async () => {
      try {
        setLoading(true);
        // Get all reactions from this listener
        const data = await reactionsService.getPlayerReactions(
          roomId,
          listenerId,
        );
        setReactions(data);
      } catch (error) {
        console.error("Failed to load reactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReactions();

    // Subscribe to all reactions for this room
    const subscription = reactionsService.subscribeToReactions(
      roomId,
      (updatedReactions) => {
        // This gets all reactions, we'll filter for relevant ones in each function
        setReactions(updatedReactions);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, listenerId]);

  // Toggle a reaction (on/off)
  const toggleReaction = async (
    type: ReactionType,
    isPrivate: boolean = true,
  ) => {
    if (!roomId || !speakerId || !listenerId || !cardId) return;
    
    try {
      // Let the service handle this without optimistic updates
      // to avoid sync issues
      await reactionsService.toggleReaction(
        roomId,
        speakerId,
        listenerId,
        cardId,
        type,
        isPrivate,
      );
      
      return true;
    } catch (error) {
      console.error("Failed to toggle reaction:", error);
      return false;
    }
  };

  // Toggle a ripple (on/off)
  const toggleRipple = async () => {
    if (!roomId || !speakerId || !listenerId || !cardId) return;

    try {
      // Let the service handle this without optimistic updates
      await reactionsService.toggleRipple(
        roomId,
        speakerId,
        listenerId,
        cardId,
      );
      return true;
    } catch (error) {
      console.error("Failed to toggle ripple:", error);
      return false;
    }
  };

  // Check if the current user has a specific reaction for this card
  const hasReaction = (type: ReactionType): boolean => {
    return reactions.some(
      (r) =>
        r.type === type && 
        r.speakerId === speakerId && 
        r.cardId === cardId &&
        r.listenerId === listenerId
    );
  };

  // Check if the current user has rippled this card
  const isRippled = (): boolean => {
    return reactions.some(
      (r) => 
        r.rippleMarked && 
        r.speakerId === speakerId && 
        r.cardId === cardId &&
        r.listenerId === listenerId
    );
  };
  
  // Get reactions of specific type for current card/speaker/listener
  const getReactions = (type: ReactionType): ListenerReaction[] => {
    return reactions.filter(
      (r) => 
        r.type === type && 
        r.speakerId === speakerId && 
        r.cardId === cardId &&
        r.listenerId === listenerId
    );
  };
  
  // Get ALL reactions of a specific type for this card (from any listener)
  const getAllReactionsOfType = (type: ReactionType): ListenerReaction[] => {
    return reactions.filter(
      (r) => 
        r.type === type && 
        r.speakerId === speakerId && 
        r.cardId === cardId
    );
  };
  
  // Get all reactions TO the current listener (that is, when listener is the speaker)
  const getReactionsToListener = (): ListenerReaction[] => {
    return reactions.filter(
      (r) => 
        r.speakerId === listenerId && 
        r.cardId === cardId
    );
  };

  return {
    reactions,
    loading,
    toggleReaction,
    toggleRipple,
    hasReaction,
    isRippled,
    getReactions,
    getAllReactionsOfType,
    getReactionsToListener
  };
}