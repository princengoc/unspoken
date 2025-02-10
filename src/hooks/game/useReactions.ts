import { useState } from 'react';
import { REACTIONS } from '@/core/game/constants';

export function useReactions(sessionId: string | null) {
  const [activeReactions, setActiveReactions] = useState<string[]>([]);
  const [isRippled, setIsRippled] = useState(false);

  const toggleReaction = (reactionId: string) => {
    setActiveReactions(prev => 
      prev.includes(reactionId)
        ? prev.filter(id => id !== reactionId)
        : [...prev, reactionId]
    );
  };

  const toggleRipple = () => {
    setIsRippled(prev => !prev);
  };

  return {
    activeReactions,
    isRippled,
    toggleReaction,
    toggleRipple,
    availableReactions: REACTIONS
  };
}