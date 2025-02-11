// src/hooks/game/useGamePhase.ts
import { useEffect, useState, useCallback } from 'react';
import { GamePhase, PlayerStatus } from '@/core/game/types';
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
  startGame: () => Promise<void>;
  completeSetup: (cardId: string) => Promise<void>;
  startRound: () => Promise<void>;
  completeRound: () => Promise<void>;
}

export function useGamePhase(sessionId: string | null): UseGamePhaseReturn {
  const { user } = useAuth();
  const stateMachine = useGameState();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(PLAYER_STATUS.CHOOSING);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Set up Supabase sync
  useGameSync(sessionId);

  // Subscribe to state machine changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = stateMachine.subscribe((state) => {
      setPhase(state.phase);
      const currentPlayer = state.players.find(p => p.id === user.id);
      if (currentPlayer) {
        setPlayerStatus(currentPlayer.status);
      }
      setCurrentRound(state.currentRound);
      setTotalRounds(state.totalRounds);
      setIsSetupComplete(state.players.every(p => p.speakOrder !== undefined));
    });

    return unsubscribe;
  }, [stateMachine, user]);

  const initializeGame = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const gameState = await gameStatesService.get(sessionId);
      
      // Restore all game state aspects
      stateMachine.dispatch(gameActions.phaseChanged(gameState.phase));
      
      if (gameState.activePlayerId) {
        stateMachine.dispatch(gameActions.setActivePlayer(gameState.activePlayerId));
      }

      if (gameState.cardsInPlay?.length > 0) {
        stateMachine.dispatch(gameActions.cardsSelected(gameState.cardsInPlay));
      }      

      // Sync player states
      gameState.players.forEach(player => {
        stateMachine.dispatch(gameActions.playerStatusChanged(
          player.id,
          player.status
        ));
      });
      
      setPhase(gameState.phase);
      setCurrentRound(gameState.currentRound);
      setTotalRounds(gameState.totalRounds);
    } catch (error) {
      console.error('Failed to initialize game state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, stateMachine]);

  const startGame = useCallback(async () => {
    if (!sessionId || !user) return;
    
    try {
      setIsLoading(true);
      
      // Reset all players to initial state
      const initialPlayers = stateMachine.getState().players.map(p => ({
        ...p,
        status: PLAYER_STATUS.CHOOSING,
        hasSpoken: false,
        speakOrder: undefined,
        selectedCard: undefined
      }));

      // Update state machine
      stateMachine.dispatch(gameActions.phaseChanged('setup'));
      
      // Sync with server
      await gameStatesService.update(sessionId, {
        phase: 'setup',
        currentRound: 1,
        players: initialPlayers,
        activePlayerId: null,
        cardsInPlay: [],
        discardPile: []
      });
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user, stateMachine]);

  const completeSetup = useCallback(async (cardId: string) => {
    if (!sessionId || !user) return;

    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      
      // Calculate speak order based on completion order
      const completedPlayers = state.players.filter(p => p.speakOrder !== undefined);
      const speakOrder = completedPlayers.length + 1;

      // Update state machine
      stateMachine.dispatch(gameActions.selectCard(user.id, cardId));
      stateMachine.dispatch(gameActions.completeSetup(user.id, speakOrder));
      stateMachine.dispatch(gameActions.playerStatusChanged(
        user.id,
        PLAYER_STATUS.BROWSING
      ));

      // Sync with server
      await gameStatesService.updatePlayerState(sessionId, user.id, {
        status: PLAYER_STATUS.BROWSING,
        speakOrder,
        selectedCard: cardId,
        hasSpoken: false
      });

      // If all players complete setup, transition to speaking phase
      const updatedState = stateMachine.getState();
      if (updatedState.players.every(p => p.speakOrder !== undefined)) {
        const firstSpeaker = updatedState.players.find(p => p.speakOrder === 1);
        if (firstSpeaker) {
          await gameStatesService.update(sessionId, {
            phase: 'speaking',
            activePlayerId: firstSpeaker.id
          });
        }
      }
    } catch (error) {
      console.error('Failed to complete setup:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, user, stateMachine]);

  const startRound = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      
      // Reset player states for new round
      const updatedPlayers = state.players.map(p => ({
        ...p,
        status: PLAYER_STATUS.CHOOSING,
        hasSpoken: false,
        speakOrder: undefined,
        selectedCard: undefined
      }));

      // Update state machine
      stateMachine.dispatch(gameActions.phaseChanged('setup'));
      
      // Sync with server
      await gameStatesService.update(sessionId, {
        phase: 'setup',
        players: updatedPlayers,
        cardsInPlay: [],
        discardPile: [],
        activePlayerId: null
      });
    } catch (error) {
      console.error('Failed to start round:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, stateMachine]);

  const completeRound = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      const state = stateMachine.getState();
      
      if (state.currentRound >= state.totalRounds) {
        // Game complete - handle end game logic
        return;
      }

      // Update round counter and reset state
      await gameStatesService.update(sessionId, {
        currentRound: state.currentRound + 1,
        phase: 'setup',
        cardsInPlay: [],
        discardPile: [],
        activePlayerId: null,
        players: state.players.map(p => ({
          ...p,
          status: PLAYER_STATUS.CHOOSING,
          hasSpoken: false,
          speakOrder: undefined,
          selectedCard: undefined
        }))
      });
    } catch (error) {
      console.error('Failed to complete round:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, stateMachine]);

  return {
    phase,
    playerStatus,
    currentRound,
    totalRounds,
    isLoading,
    isSetupComplete,
    initializeGame,
    startGame,
    completeSetup,
    startRound,
    completeRound
  };
}