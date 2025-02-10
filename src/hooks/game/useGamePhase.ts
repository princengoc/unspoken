import { useEffect, useState } from 'react';
import { GameStateMachine } from '@/core/game/stateMachine';
import { GamePhase, Player } from '@/core/game/types';
import { sessionsService } from '@/services/supabase/sessions';

export function useGamePhase(sessionId: string | null, initialPlayers: Player[]) {
  const [stateMachine] = useState(() => new GameStateMachine(initialPlayers));
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

  const startGame = () => {
    stateMachine.dispatch({ type: 'START_GAME' });
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