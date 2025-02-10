import { useState, useEffect } from 'react';
import { sessionsService } from '@/services/supabase/sessions';
import { Player } from '@/core/game/types';

export function useTurnManagement(sessionId: string | null, players: Player[]) {
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);
  const [isSpeakerSharing, setIsSpeakerSharing] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const subscription = sessionsService.subscribeToChanges(sessionId, (session) => {
      if (session.active_player_id !== activePlayerId) {
        setActivePlayerId(session.active_player_id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, activePlayerId]);

  const startTurn = async (playerId: string) => {
    if (!sessionId) return;
    
    try {
      await sessionsService.update(sessionId, {
        active_player_id: playerId
      });
      setActivePlayerId(playerId);
      setIsSpeakerSharing(false);
    } catch (error) {
      console.error('Failed to start turn:', error);
      throw error;
    }
  };

  const startSharing = () => {
    setIsSpeakerSharing(true);
  };

  const endSharing = async () => {
    if (!sessionId || !activePlayerId) return;
    
    try {
      // Find next player in rotation
      const currentIndex = players.findIndex(p => p.id === activePlayerId);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayerId = players[nextIndex].id;

      await startTurn(nextPlayerId);
    } catch (error) {
      console.error('Failed to end sharing:', error);
      throw error;
    }
  };

  const isActiveSpeaker = (userId: string) => {
    return userId === activePlayerId;
  };

  return {
    activePlayerId,
    isSpeakerSharing,
    isActiveSpeaker,
    startTurn,
    startSharing,
    endSharing
  };
}