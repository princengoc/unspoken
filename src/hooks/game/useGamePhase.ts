import { useEffect, useState } from 'react';
import { GamePhase, Player } from '@/core/game/types';
import { sessionsService } from '@/services/supabase/sessions';
import { useGameState } from '@/context/GameStateProvider';

export function useGamePhase(sessionId: string | null, initialPlayers: Player[]) {
  const stateMachine = useGameState();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [isSpeakerSharing, setIsSpeakerSharing] = useState(false);
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to state machine changes
    const unsubscribe = stateMachine.subscribe((state) => {
      setPhase(state.phase);
      setIsSpeakerSharing(state.isSpeakerSharing);
      setActivePlayerId(state.activePlayerId);

      // Sync with Supabase
      sessionsService.update(sessionId, {
        current_phase: state.phase,
        active_player_id: state.activePlayerId
      }).catch(console.error);
    });

    // Subscribe to remote changes
    const subscription = sessionsService.subscribeToChanges(sessionId, (session) => {
      if (session.current_phase !== phase) {
        stateMachine.dispatch({ type: 'PHASE_CHANGED', phase: session.current_phase });
      }
      if (session.active_player_id !== activePlayerId) {
        stateMachine.dispatch({ type: 'ACTIVE_PLAYER_CHANGED', playerId: session.active_player_id });
      }
    });

    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
  }, [sessionId, stateMachine, phase, activePlayerId]);

  const startGame = async () => {
    if (!sessionId) return;
    
    try {
      // Update state machine
      stateMachine.dispatch({ type: 'START_GAME' });
      
      // Add this Supabase update
      await sessionsService.update(sessionId, {
        current_phase: 'speaking',
        active_player_id: activePlayerId
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  const startSharing = () => {
    stateMachine.dispatch({ type: 'START_SHARING' });
  };

  const endSharing = () => {
    stateMachine.dispatch({ type: 'END_SHARING' });
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