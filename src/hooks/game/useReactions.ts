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


  const toggleReaction = async (type: ReactionType, isPrivate: boolean = true) => {
    if (!roomId || !speakerId || !listenerId || !cardId) return;
    // optimistically update
    setReactions((prev) => {
      const alreadyReacted = prev.some(r => r.type === type && r.speakerId === speakerId && r.cardId === cardId);
      return alreadyReacted
        ? prev.filter(r => !(r.type === type && r.speakerId === speakerId && r.cardId === cardId))
        : [
            ...prev,
            {
              id: '',  // Placeholder, will be updated by Supabase
              roomId, 
              speakerId, 
              listenerId, 
              cardId, 
              type,
              isPrivate: isPrivate,
              rippleMarked: false,
            }
          ];
    });
  
    try {
      await reactionsService.toggleReaction(roomId, speakerId, listenerId, cardId, type, isPrivate);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };
  

  const toggleRipple = async () => {
    if (!roomId || !speakerId || !listenerId || !cardId) return;

    setReactions((prev) => {
      const alreadyRippled = prev.some(r => r.rippleMarked && r.speakerId === speakerId && r.cardId === cardId);
      return prev.map(r =>
        r.speakerId === speakerId && r.cardId === cardId
          ? { ...r, rippleMarked: !alreadyRippled }
          : r
      );
    });

    try {
      await reactionsService.toggleRipple(roomId, speakerId, listenerId, cardId);
    } catch (error) {
      console.error('Failed to toggle ripple:', error);
    }
  };

  const hasReaction = (type: ReactionType): boolean => {
    return reactions.some(r => r.type === type && r.speakerId === speakerId && r.cardId === cardId);
  };

  const isRippled = (): boolean => {
    return reactions.some(r => r.rippleMarked && r.speakerId === speakerId && r.cardId === cardId);
  };

  return {
    reactions,
    toggleReaction,
    toggleRipple,
    hasReaction,
    isRippled
  };
}
