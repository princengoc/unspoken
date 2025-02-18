import { useState, useEffect, useRef } from 'react';
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
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

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

  const debounce = (key: string, callback: () => void) => {
    if (debounceRef.current[key]) {
      clearTimeout(debounceRef.current[key]);
    }
    debounceRef.current[key] = setTimeout(callback, 300); // 300 seconds debounce
  };

  const toggleReaction = (type: ReactionType, isPrivate: boolean = true) => {
    if (!gameStateId || !speakerId || !listenerId || !cardId) return;
  
    debounce(type, async () => {
      setReactions((prev) => {
        const alreadyReacted = prev.some(r => r.type === type && r.speakerId === speakerId && r.cardId === cardId);
        return alreadyReacted
          ? prev.filter(r => !(r.type === type && r.speakerId === speakerId && r.cardId === cardId))
          : [
              ...prev,
              {
                id: '',  // Placeholder, will be updated by Supabase
                gameStateId, 
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
        await reactionsService.toggleReaction(gameStateId, speakerId, listenerId, cardId, type, isPrivate);
      } catch (error) {
        console.error('Failed to toggle reaction:', error);
      }
    });
  };
  

  const toggleRipple = () => {
    if (!gameStateId || !speakerId || !listenerId || !cardId) return;

    debounce('ripple', async () => {
      setReactions((prev) => {
        const alreadyRippled = prev.some(r => r.rippleMarked && r.speakerId === speakerId && r.cardId === cardId);
        return prev.map(r =>
          r.speakerId === speakerId && r.cardId === cardId
            ? { ...r, rippleMarked: !alreadyRippled }
            : r
        );
      });

      try {
        await reactionsService.toggleRipple(gameStateId, speakerId, listenerId, cardId);
      } catch (error) {
        console.error('Failed to toggle ripple:', error);
      }
    });
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
