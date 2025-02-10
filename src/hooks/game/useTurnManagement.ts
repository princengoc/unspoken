import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';
import { Player } from '@/core/game/types';

export function useTurnManagement(sessionId: string | null, players: Player[]) {
  const stateMachine = useGameState();
  const state = stateMachine.getState();
  
  const startTurn = async (playerId: string) => {
    if (!sessionId) return;
    
    try {
      // Update state machine first
      stateMachine.dispatch(gameActions.activePlayerChanged(playerId));
      
      // Then sync with Supabase
      await gameStatesService.update(sessionId, {
        activePlayerId: playerId,
        isSpeakerSharing: false
      });
    } catch (error) {
      console.error('Failed to start turn:', error);
      throw error;
    }
  };

  const startSharing = async () => {
    if (!sessionId) return;
    
    try {
      // Update state machine
      stateMachine.dispatch(gameActions.startSharing());
      
      // Sync with Supabase
      await gameStatesService.update(sessionId, {
        phase: 'listening',
        isSpeakerSharing: true
      });
    } catch (error) {
      console.error('Failed to start sharing:', error);
      throw error;
    }
  };

  const endSharing = async () => {
    if (!sessionId || !state.activePlayerId) return;
    
    try {
      // Find next player in rotation
      const currentIndex = players.findIndex(p => p.id === state.activePlayerId);
      const nextIndex = (currentIndex + 1) % players.length;
      const nextPlayerId = players[nextIndex].id;

      // Update state machine
      stateMachine.dispatch(gameActions.endSharing());
      
      // Start next turn
      await startTurn(nextPlayerId);
    } catch (error) {
      console.error('Failed to end sharing:', error);
      throw error;
    }
  };

  const isActiveSpeaker = (userId: string): boolean => {
    return userId === state.activePlayerId;
  };

  return {
    activePlayerId: state.activePlayerId,
    isSpeakerSharing: state.isSpeakerSharing,
    isActiveSpeaker,
    startTurn,
    startSharing,
    endSharing
  };
}