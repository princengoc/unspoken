// src/hooks/game/useTurnManagement.ts
import { useState } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { useAuth } from '@/context/AuthProvider';
import { gameActions } from '@/core/game/actions';
import { Player } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';

interface UseTurnManagementReturn {
  activePlayerId: string | null;
  isLoading: boolean;
  isActiveSpeaker: boolean;
  currentSpeaker: Player | null;
  nextSpeaker: Player | null;
  speakingOrder: Player[];
  canStartSpeaking: boolean;
  startSpeaking: () => Promise<void>;
  finishSpeaking: () => Promise<void>;
}

export function useTurnManagement(gameStateId: string | null): UseTurnManagementReturn {
  const { user } = useAuth();
  const stateMachine = useGameState();
  const [isLoading, setIsLoading] = useState(false);

  // Read current state.
  const state = stateMachine.getState();
  const activePlayerId = state.activePlayerId;
  const isActiveSpeaker = user?.id === activePlayerId;

  // Build an ordered list of players by their speakOrder.
  const speakingOrder = [...state.players]
    .filter(p => p.speakOrder !== undefined)
    .sort((a, b) => (a.speakOrder || 0) - (b.speakOrder || 0));

  // Identify the current speaker and the next speaker.
  const currentSpeaker = state.players.find(p => p.id === activePlayerId) || null;
  const currentSpeakerIndex = speakingOrder.findIndex(p => p.id === activePlayerId);
  const nextSpeaker = currentSpeakerIndex < speakingOrder.length - 1 ?
    speakingOrder[currentSpeakerIndex + 1] :
    null;

  // The current player can start speaking if they are the active speaker,
  // their status is BROWSING, and the game phase is 'speaking'.
  const canStartSpeaking = isActiveSpeaker &&
    currentSpeaker?.status === PLAYER_STATUS.BROWSING &&
    state.phase === 'speaking';

  // Called when the active speaker wants to start sharing.
  const startSpeaking = async () => {
    if (!gameStateId || !user || !isActiveSpeaker) return;
    
    try {
      setIsLoading(true);

      // Update the local state: current user becomes SPEAKING.
      stateMachine.dispatch(gameActions.playerStatusChanged(
        user.id,
        PLAYER_STATUS.SPEAKING
      ));

      // Update all players: set current speaker to SPEAKING, and others to LISTENING.
      const updatedPlayers = state.players.map(player => ({
        ...player,
        status: player.id === user.id ? PLAYER_STATUS.SPEAKING : PLAYER_STATUS.LISTENING
      }));

      // Sync these changes with the server.
      await gameStatesService.update(gameStateId, {
        players: updatedPlayers,
        isSpeakerSharing: true
      });
    } catch (error) {
      console.error('Failed to start speaking:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Called when the active speaker finishes sharing.
  const finishSpeaking = async () => {
    if (!gameStateId || !user || !isActiveSpeaker) return;
    
    try {
      setIsLoading(true);

      // Find the next speaker who has not yet spoken.
      const nextUnspokenSpeaker = speakingOrder.find(p => !p.hasSpoken && p.id !== user.id);

      // Update players:
      // - Mark the current speaker as having spoken.
      // - Set their status to LISTENING.
      // - If there is a next speaker, set their status to BROWSING.
      const updatedPlayers = state.players.map(player => {
        if (player.id === user.id) {
          return { ...player, hasSpoken: true, status: PLAYER_STATUS.LISTENING };
        }
        if (nextUnspokenSpeaker && player.id === nextUnspokenSpeaker.id) {
          return { ...player, status: PLAYER_STATUS.BROWSING };
        }
        return player;
      });

      // Remove the current speaker's selected card from cardsInPlay
      // and add it to the discard pile.
      const currentCardId = currentSpeaker?.selectedCard;
      const updatedCardsInPlay = currentCardId
        ? state.cardsInPlay.filter(card => card.id !== currentCardId)
        : state.cardsInPlay;
      const updatedDiscardPile = currentCardId
        ? [...state.discardPile, ...state.cardsInPlay.filter(card => card.id === currentCardId)]
        : state.discardPile;

      // Determine whether all players have spoken.
      const allSpoken = updatedPlayers.every(p => p.hasSpoken);
      const updates: Partial<any> = {
        players: updatedPlayers,
        cardsInPlay: updatedCardsInPlay,
        discardPile: updatedDiscardPile,
        isSpeakerSharing: false,
        activePlayerId: nextUnspokenSpeaker?.id || null,
      };

      // If all players have spoken, transition the phase back to 'setup'
      // and increment the round counter.
      if (allSpoken) {
        updates.phase = 'setup';
        updates.currentRound = state.currentRound + 1;
        stateMachine.dispatch(gameActions.completeRound());
      }

      // Update the active player.
      stateMachine.dispatch(gameActions.setActivePlayer(updates.activePlayerId));

      // Sync all updates with the server.
      await gameStatesService.update(gameStateId, updates);
    } catch (error) {
      console.error('Failed to finish speaking:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    activePlayerId,
    isLoading,
    isActiveSpeaker,
    currentSpeaker,
    nextSpeaker,
    speakingOrder,
    canStartSpeaking,
    startSpeaking,
    finishSpeaking,
  };
}
