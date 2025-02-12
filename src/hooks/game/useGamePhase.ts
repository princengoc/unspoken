// src/hooks/game/useGamePhase.ts
import { useEffect, useState, useCallback } from 'react';
import { GamePhase, PlayerStatus, Player } from '@/core/game/types';
import { gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { useAuth } from '@/context/AuthProvider';
import { gameActions } from '@/core/game/actions';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useGameSync } from './useGameSync';

interface UseGamePhaseReturn {
  phase: GamePhase;
  playerStatus: PlayerStatus;
  currentRound: number;
  totalRounds: number;
  isLoading: boolean;
  isSetupComplete: boolean;
  initializeGame: () => Promise<void>;
  startSpeakPhase: () => Promise<void>;
  completeSetup: (cardId: string) => Promise<void>;
  startRound: () => Promise<void>;
  completeRound: () => Promise<void>;
  handleAllPlayersSetupComplete: () => Promise<void>;
}

export function useGamePhase(gameStateId: string | null): UseGamePhaseReturn {
  const { user } = useAuth();
  const stateMachine = useGameState();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(PLAYER_STATUS.CHOOSING);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Set up real-time sync
  useGameSync(gameStateId);

  // Subscribe to state changes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = stateMachine.subscribe((state) => {
      setPhase(state.phase);
      const currentPlayer = state.players.find((p) => p.id === user.id);
      if (currentPlayer) {
        setPlayerStatus(currentPlayer.status);
      }
      setCurrentRound(state.currentRound);
      setTotalRounds(state.totalRounds);
      // A player is “done” if they have a speakOrder defined.
      setIsSetupComplete(state.players.every((p) => p.speakOrder !== undefined));
    });
    return unsubscribe;
  }, [stateMachine, user]);

  const initializeGame = useCallback(async () => {
    if (!gameStateId) return;
    try {
      setIsLoading(true);
      const gameState = await gameStatesService.get(gameStateId);
      stateMachine.dispatch(gameActions.phaseChanged(gameState.phase));
      if (gameState.activePlayerId) {
        stateMachine.dispatch(gameActions.setActivePlayer(gameState.activePlayerId));
      }
      if (gameState.cardsInPlay?.length > 0) {
        stateMachine.dispatch(gameActions.cardsSelected(gameState.cardsInPlay));
      }
      gameState.players.forEach((player) => {
        stateMachine.dispatch(gameActions.playerStatusChanged(player.id, player.status));
      });
      setPhase(gameState.phase);
      setCurrentRound(gameState.currentRound);
      setTotalRounds(gameState.totalRounds);
    } catch (error) {
      console.error('Failed to initialize game state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gameStateId, stateMachine]);

  // Helper: orders players and designates the first speaker.
  const orderPlayersForSpeaking = useCallback((players: Player[]) => {
    return players.map((player, index) => ({
      ...player,
      speakOrder: index + 1,
      status: index === 0 ? PLAYER_STATUS.SPEAKING : PLAYER_STATUS.LISTENING,
    }));
  }, []);

  const startSpeakPhase = useCallback(async () => {
    if (!gameStateId || !user) return;
    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      // Expect every player to be ready (status === BROWSING)
      const readyPlayers = state.players.filter((p) => p.status === PLAYER_STATUS.BROWSING);
      if (readyPlayers.length !== state.players.length) {
        throw new Error('Not all players are ready');
      }
      const orderedPlayers = orderPlayersForSpeaking(readyPlayers);
      const firstSpeaker = orderedPlayers[0];
      stateMachine.dispatch(gameActions.phaseChanged('speaking'));
      stateMachine.dispatch(gameActions.setActivePlayer(firstSpeaker.id));
      await gameStatesService.update(gameStateId, {
        phase: 'speaking',
        players: orderedPlayers,
        activePlayerId: firstSpeaker.id,
        isSpeakerSharing: false,
      });
    } catch (error) {
      console.error('Failed to start speak phase:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [gameStateId, user, stateMachine, orderPlayersForSpeaking]);

  const completeSetup = useCallback(async (cardId: string) => {
    if (!gameStateId || !user) return;
    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      const completedPlayers = state.players.filter((p) => p.speakOrder !== undefined);
      const speakOrder = completedPlayers.length + 1;
      stateMachine.dispatch(gameActions.selectCard(user.id, cardId));
      stateMachine.dispatch(gameActions.completeSetup(user.id, speakOrder));
      stateMachine.dispatch(gameActions.playerStatusChanged(user.id, PLAYER_STATUS.BROWSING));
      await gameStatesService.updatePlayerState(gameStateId, user.id, {
        status: PLAYER_STATUS.BROWSING,
        speakOrder,
        selectedCard: cardId,
        hasSpoken: false,
      });
    } catch (error) {
      console.error('Failed to complete setup:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [gameStateId, user, stateMachine]);

  const resetPlayersState = useCallback((players: Player[]) => {
    return players.map((p) => ({
      ...p,
      status: PLAYER_STATUS.CHOOSING,
      hasSpoken: false,
      speakOrder: undefined,
      selectedCard: undefined,
    }));
  }, []);

  const startRound = useCallback(async () => {
    if (!gameStateId) return;
    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      const updatedPlayers = resetPlayersState(state.players);
      stateMachine.dispatch(gameActions.phaseChanged('setup'));
      await gameStatesService.update(gameStateId, {
        phase: 'setup',
        players: updatedPlayers,
        cardsInPlay: [],
        discardPile: [],
        activePlayerId: null,
      });
    } catch (error) {
      console.error('Failed to start round:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [gameStateId, stateMachine, resetPlayersState]);

  const completeRound = useCallback(async () => {
    if (!gameStateId) return;
    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      if (state.currentRound >= state.totalRounds) {
        // End-game logic can be added here.
        return;
      }
      await gameStatesService.update(gameStateId, {
        currentRound: state.currentRound + 1,
        phase: 'setup',
        cardsInPlay: [],
        discardPile: [],
        activePlayerId: null,
        players: resetPlayersState(state.players),
      });
    } catch (error) {
      console.error('Failed to complete round:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [gameStateId, stateMachine, resetPlayersState]);

  // This callback is invoked by the room creator (via a button) when everyone is ready.
  const handleAllPlayersSetupComplete = useCallback(async () => {
    const state = stateMachine.getState();
    if (!state.players.every((p) => p.speakOrder !== undefined)) {
      console.warn('Not all players have completed setup');
      return;
    }
    await startSpeakPhase();
  }, [stateMachine, startSpeakPhase]);

  return {
    phase,
    playerStatus,
    currentRound,
    totalRounds,
    isLoading,
    isSetupComplete,
    initializeGame,
    startSpeakPhase,
    completeSetup,
    startRound,
    completeRound,
    handleAllPlayersSetupComplete,
  };
}
