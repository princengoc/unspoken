// src/hooks/game/useGameSync.ts

import { useEffect, useCallback } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { useAuth } from '@/context/AuthProvider';
import { gameActions } from '@/core/game/actions';
import { GameState } from '@/core/game/types';

export function useGameSync(gameStateId: string | null) {
  const { user } = useAuth();
  const stateMachine = useGameState();

  // Restore player state from saved game state
  const restorePlayerState = useCallback(async () => {
    if (!gameStateId || !user) return;

    try {
      const savedState = await gameStatesService.get(gameStateId);
      const savedPlayer = savedState.players.find(p => p.id === user.id);

      if (savedPlayer) {
        // Update local state machine with saved player state
        stateMachine.dispatch(gameActions.playerStatusChanged(
          user.id,
          savedPlayer.status
        ));

        if (savedPlayer.selectedCard) {
          stateMachine.dispatch(gameActions.selectCard(
            user.id,
            savedPlayer.selectedCard
          ));
        }

        if (savedPlayer.speakOrder !== undefined) {
          stateMachine.dispatch(gameActions.completeSetup(
            user.id,
            savedPlayer.speakOrder
          ));
        }

        await gameStatesService.updatePlayerState(gameStateId, user.id, {
          isOnline: true,
        });
      }
    } catch (error) {
      console.error('Failed to restore player state:', error);
    }
  }, [gameStateId, user, stateMachine]);

  // Handle state updates from server
  const handleStateUpdate = useCallback(async (newState: GameState) => {
    const currentState = stateMachine.getState();

    // Sync phase changes
    if (newState.phase !== currentState.phase) {
      stateMachine.dispatch(gameActions.phaseChanged(newState.phase));
    }

    // Sync round state
    if (newState.currentRound !== currentState.currentRound) {
      if (newState.currentRound > currentState.currentRound) {
        stateMachine.dispatch(gameActions.completeRound());
        stateMachine.dispatch(gameActions.startNewRound());
      }
    }

    // Sync player states
    newState.players.forEach(player => {
      const currentPlayer = currentState.players.find(p => p.id === player.id);
      if (!currentPlayer || 
          currentPlayer.status !== player.status || 
          currentPlayer.hasSpoken !== player.hasSpoken ||
          currentPlayer.speakOrder !== player.speakOrder) {
        
        // Update player status
        stateMachine.dispatch(gameActions.playerStatusChanged(
          player.id,
          player.status
        ));

        // Update speak order if changed
        if (player.speakOrder !== currentPlayer?.speakOrder) {
          stateMachine.dispatch(gameActions.completeSetup(
            player.id,
            player.speakOrder || 0
          ));
        }
      }
    });

    // Sync active player
    if (newState.activePlayerId !== currentState.activePlayerId) {
      stateMachine.dispatch(gameActions.setActivePlayer(newState.activePlayerId));
    }

    // Sync cards in play
    if (newState.cardsInPlay) {
      stateMachine.dispatch(gameActions.cardsSelected(newState.cardsInPlay));
    }

    // Sync player hands
    if (newState.playerHands) {
      Object.entries(newState.playerHands).forEach(([playerId, cards]) => {
        if (JSON.stringify(currentState.playerHands[playerId]) !== JSON.stringify(cards)) {
          stateMachine.dispatch(gameActions.cardsDealt(playerId, cards));
        }
      });
    }

    // Sync discard pile
    if (JSON.stringify(newState.discardPile) !== JSON.stringify(currentState.discardPile)) {
      const newCardIds = newState.discardPile
        .filter(card => !currentState.discardPile.some(c => c.id === card.id))
        .map(card => card.id);
      
      if (newCardIds.length > 0) {
        stateMachine.dispatch(gameActions.moveToDiscardPile(newCardIds));
      }
    }
  }, [stateMachine]);

  // Set up Supabase sync
  useEffect(() => {
    if (!gameStateId) return;

    // First restore player state
    restorePlayerState();

    // Then subscribe to changes
    const subscription = gameStatesService.subscribeToChanges(
      gameStateId,
      handleStateUpdate
    );

    // Cleanup subscription and mark player as offline
    return () => {
      subscription.unsubscribe();
      if (gameStateId && user?.id) {
        gameStatesService.updatePlayerState(gameStateId, user.id, {
          isOnline: false,
        }).catch(console.error);
      }
    };
  }, [gameStateId, user?.id, restorePlayerState, handleStateUpdate]);

  // Handle window/tab close
  useEffect(() => {
    if (!gameStateId || !user?.id) return;

    const handleBeforeUnload = () => {
      gameStatesService.updatePlayerState(gameStateId, user.id, {
        isOnline: false,
      }).catch(console.error);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameStateId, user?.id]);
}