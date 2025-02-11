// src/hooks/game/useTurnManagement.ts

import { useState } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { useAuth } from '@/context/AuthProvider';
import { gameActions } from '@/core/game/actions';
import { GamePhase, Player } from '@/core/game/types';
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

export function useTurnManagement(sessionId: string | null): UseTurnManagementReturn {
  const { user } = useAuth();
  const stateMachine = useGameState();
  const [isLoading, setIsLoading] = useState(false);

  // Get current state values
  const state = stateMachine.getState();
  const activePlayerId = state.activePlayerId;
  const isActiveSpeaker = user?.id === activePlayerId;

  // Get ordered list of players by speakOrder
  const speakingOrder = [...state.players]
    .filter(p => p.speakOrder !== undefined)
    .sort((a, b) => (a.speakOrder || 0) - (b.speakOrder || 0));

  // Find current and next speakers
  const currentSpeaker = state.players.find(p => p.id === activePlayerId) || null;
  const currentSpeakerIndex = speakingOrder.findIndex(p => p.id === activePlayerId);
  const nextSpeaker = currentSpeakerIndex < speakingOrder.length - 1 ?
    speakingOrder[currentSpeakerIndex + 1] :
    null;

  // Determine if current player can start speaking
  const canStartSpeaking = isActiveSpeaker && 
    currentSpeaker?.status === PLAYER_STATUS.BROWSING &&
    state.phase === 'speaking';

  const startSpeaking = async () => {
    if (!sessionId || !user || !isActiveSpeaker) return;
    
    try {
      setIsLoading(true);

      // Update local state first
      stateMachine.dispatch(gameActions.playerStatusChanged(
        user.id,
        PLAYER_STATUS.SPEAKING
      ));

      // Update other players to listening state
      const updatedPlayers = state.players.map(player => ({
        ...player,
        status: player.id === user.id ? 
          PLAYER_STATUS.SPEAKING : 
          PLAYER_STATUS.LISTENING
      }));

      // Sync with server
      await gameStatesService.update(sessionId, {
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

  const finishSpeaking = async () => {
    if (!sessionId || !user || !isActiveSpeaker) return;
    
    try {
      setIsLoading(true);

      // Find next speaker who hasn't spoken yet
      const nextUnspokenSpeaker = speakingOrder
        .find(p => !p.hasSpoken && p.id !== user.id);

      // Update current speaker's state
      const updatedPlayers = state.players.map(player => {
        if (player.id === user.id) {
          return {
            ...player,
            hasSpoken: true,
            status: PLAYER_STATUS.LISTENING
          };
        }
        // Update next speaker's status if exists
        if (nextUnspokenSpeaker && player.id === nextUnspokenSpeaker.id) {
          return {
            ...player,
            status: PLAYER_STATUS.BROWSING
          };
        }
        return player;
      });

      // Move current card to discard pile
      const currentCardId = currentSpeaker?.selectedCard;
      const updatedCardsInPlay = currentCardId ?
        state.cardsInPlay.filter(card => card.id !== currentCardId) :
        state.cardsInPlay;
      const updatedDiscardPile = currentCardId ?
        [...state.discardPile, ...state.cardsInPlay.filter(card => card.id === currentCardId)] :
        state.discardPile;

      // Determine if round is complete
      const allSpoken = updatedPlayers.every(p => p.hasSpoken);
      const updates = {
        players: updatedPlayers,
        cardsInPlay: updatedCardsInPlay,
        discardPile: updatedDiscardPile,
        isSpeakerSharing: false,
        activePlayerId: nextUnspokenSpeaker?.id || null,
        ...(allSpoken && {
          phase: 'setup' as GamePhase,
          currentRound: state.currentRound + 1
        })
      };

      // Update state machine
      if (allSpoken) {
        stateMachine.dispatch(gameActions.completeRound());
      }
      stateMachine.dispatch(gameActions.setActivePlayer(updates.activePlayerId));

      // Sync with server
      await gameStatesService.update(sessionId, updates);

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