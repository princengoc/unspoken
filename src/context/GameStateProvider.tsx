import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import type { GamePhase, GameState } from '@/core/game/types';
import { notifications } from "@mantine/notifications";

interface GameStateContextType {
  // Core game state
  phase: GamePhase;
  currentRound: number;
  activePlayerId: string | null;
  
  // Phase management
  setPhase: (phase: GamePhase) => Promise<void>;
  setActivePlayer: (playerId: string | null) => Promise<void>;
  
  // Round management
  startNewRound: () => Promise<void>;
  completeRound: () => Promise<void>;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

interface GameStateProviderProps {
  roomId: string;
  gameStateId: string;
  children: ReactNode;
}

export function GameStateProvider({ roomId, gameStateId, children }: GameStateProviderProps) {
  const [gameState, setGameState] = useState<GameState>({
    room_id: roomId, 
    id: gameStateId,
    phase: 'setup',
    currentRound: 1,
    activePlayerId: null,
  });

  // Handle Supabase realtime updates
  useEffect(() => {
    const handleGameStateUpdate = (newState: GameState) => {
      setGameState(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newState)) {
          return prev;
        }
        return newState;
      });
    };

    // Initial fetch
    const fetchInitialState = async () => {
      try {
        const state = await gameStatesService.get(gameStateId);
        handleGameStateUpdate(state);
      } catch (error) {
        console.error('Failed to fetch initial game state:', error);
      }
    };
    fetchInitialState();

    // Subscribe to changes
    const subscription = gameStatesService.subscribeToChanges(
      gameStateId,
      handleGameStateUpdate
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [gameStateId]);

  // State update helpers with optimistic updates
  const updateGameState = async <K extends keyof GameState>(
    key: K,
    value: GameState[K]
  ) => {
    setGameState(prev => ({ ...prev, [key]: value }));
    try {
      await gameStatesService.update(gameStateId, { [key]: value });
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      setGameState(prev => ({ ...prev, [key]: gameState[key] }));
      throw error;
    }
  };

  // Phase management
  const setPhase = async (phase: GamePhase) => {
    await updateGameState('phase', phase);
  };

  const setActivePlayer = async (playerId: string | null) => {
    await updateGameState('activePlayerId', playerId);
  };

  // Round management
  const startNewRound = async () => {
    try {
      const updates = {
        phase: 'setup' as GamePhase,
        currentRound: gameState.currentRound + 1,
        activePlayerId: null,
      };
      
      setGameState(prev => ({ ...prev, ...updates }));
      await gameStatesService.update(gameStateId, updates);
    } catch (error) {
      console.error('Failed to start new round:', error);
      throw error;
    }
  };

  const completeRound = async () => {
    try {
      notifications.show({ title: "Success", message: "Game finished!", color: "green" });
      const updates = {
        phase: 'endgame' as GamePhase, 
        activePlayerId: null
      };
      setGameState(prev => ({...prev, ...updates }));
      await gameStatesService.update(gameStateId, updates)
    } catch (error) {
      console.error(`Failed to complete round: ${JSON.stringify(error)}`);
      throw error;
    }
  };

  const value = {
    // State
    ...gameState,
    
    // Actions
    setPhase,
    setActivePlayer,
    startNewRound,
    completeRound,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}