import { useEffect, useState } from 'react';
import { GamePhase } from '@/core/game/types';
import { sessionsService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';
import { useGameSync } from './useGameSync';

export function useGamePhase(sessionId: string | null) {
  const stateMachine = useGameState();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [isSpeakerSharing, setIsSpeakerSharing] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  // Set up Supabase sync
  useGameSync(sessionId);

  // Subscribe to state machine changes
  useEffect(() => {
    const unsubscribe = stateMachine.subscribe((state) => {
      setPhase(state.phase);
      setIsSpeakerSharing(state.isSpeakerSharing);
      setActivePlayerId(state.activePlayerId);
    });

    return unsubscribe;
  }, [stateMachine]);

  const startGame = async () => {
    if (!sessionId) return;
    
    try {
      // Update state machine first
      stateMachine.dispatch(gameActions.startGame());
      
      // Then sync with Supabase
      await sessionsService.update(sessionId, {
        phase: 'speaking',
        activePlayerId: activePlayerId
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  const startSharing = async () => {
    if (!sessionId) return;

    try {
      stateMachine.dispatch(gameActions.startSharing());
      await sessionsService.update(sessionId, {
        phase: 'listening',
        isSpeakerSharing: true
      });
    } catch (error) {
      console.error('Failed to start sharing:', error);
      throw error;
    }
  };

  const endSharing = async () => {
    if (!sessionId) return;

    try {
      stateMachine.dispatch(gameActions.endSharing());
      const state = stateMachine.getState();
      
      await sessionsService.update(sessionId, {
        phase: 'speaking',
        isSpeakerSharing: false,
        activePlayerId: state.activePlayerId
      });
    } catch (error) {
      console.error('Failed to end sharing:', error);
      throw error;
    }
  };

  return {
    phase,
    isSpeakerSharing,
    activePlayerId,
    startGame,
    startSharing,
    endSharing
  };
}