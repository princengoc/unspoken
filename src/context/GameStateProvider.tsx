import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import type { GamePhase, Card, GameState } from '@/core/game/types';
import { DEFAULT_TOTAL_ROUNDS } from '@/core/game/constants';

interface GameStateContextType {
  // Core game state
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  activePlayerId: string | null;

  // Card states
  cardsInPlay: Card[];
  discardPile: Card[];
  
  // Phase management
  setPhase: (phase: GamePhase) => Promise<void>;
  setActivePlayer: (playerId: string | null) => Promise<void>;
  
  // Global card management
  addCardToPlay: (card: Card) => Promise<void>;
  moveCardToDiscard: (cardId: string) => Promise<void>;

  // Card management that includes roomMembersService update
  dealCards: (playerId: string) => Promise<Card[]>;
  
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
  // Complete game state
  const [gameState, setGameState] = useState<GameState>({
    room_id: roomId, 
    id: gameStateId,
    phase: 'setup',
    currentRound: 1,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    activePlayerId: null,
    cardsInPlay: [],
    discardPile: [],
  });

  // Handle Supabase realtime updates
  useEffect(() => {
    const handleGameStateUpdate = (newState: GameState) => {
      setGameState(prev => {
        // Only update if there are actual changes
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
    // Optimistic update
    setGameState(prev => ({ ...prev, [key]: value }));
    
    try {
      // Server update
      await gameStatesService.update(gameStateId, { [key]: value });
    } catch (error) {
      // Rollback on error
      console.error(`Failed to update ${key}:`, error);
      setGameState(prev => ({ ...prev, [key]: gameState[key] }));
      throw error;
    }
  };

  const updateGameStateMultiple = async (updates: Partial<GameState>) => {
    // Build a rollback object from the current gameState values
    const previousValues = Object.fromEntries(
      (Object.keys(updates) as Array<keyof GameState>).map((key) => [key, gameState[key]])
    ) as Partial<GameState>;
  
    // Optimistically update the state
    setGameState((prev) => ({ ...prev, ...updates }));
  
    try {
      // Send updates to the server
      await gameStatesService.update(gameStateId, updates);
    } catch (error) {
      console.error('Failed to update game state with multiple values:', error);
      // Rollback to previous values on error
      setGameState((prev) => ({ ...prev, ...previousValues }));
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

  // Card management
  const dealCards = async (playerId: string) => {
    try { 
      return await gameStatesService.dealCards(gameStateId, playerId); 
    } catch (error) {
      console.error(`Failed to deal cards: ${JSON.stringify(error)}`);
      throw error
    }
  }


  const addCardToPlay = async (card: Card) => {
    const updatedCards = [...gameState.cardsInPlay, card];
    await updateGameState('cardsInPlay', updatedCards);
  };

  const moveCardToDiscard = async (cardId: string) => {
    const cardToMove = gameState.cardsInPlay.find(c => c.id === cardId);
    if (!cardToMove) return;

    const updatedCardsInPlay = gameState.cardsInPlay.filter(c => c.id !== cardId);
    const updatedDiscardPile = [...gameState.discardPile, cardToMove];
    updateGameStateMultiple({
      discardPile: updatedDiscardPile, 
      cardsInPlay: updatedCardsInPlay
    })
  };

  // Round management
  const startNewRound = async () => {
    try {
      const updates = {
        phase: 'setup' as GamePhase,
        currentRound: gameState.currentRound + 1,
        activePlayerId: null,
        cardsInPlay: [],
        discardPile: [],
      };
      
      // Optimistic update
      setGameState(prev => ({ ...prev, ...updates }));
      
      // Server update
      await gameStatesService.update(gameStateId, updates);
    } catch (error) {
      console.error('Failed to start new round:', error);
      throw error;
    }
  };

  const completeRound = async () => {
    if (gameState.currentRound >= gameState.totalRounds) {
      // Handle game completion - could emit an event or update game status
      return;
    }
    await startNewRound();
  };

  const value = {
    // State
    ...gameState,
    
    // Actions
    setPhase,
    setActivePlayer,
    addCardToPlay,
    moveCardToDiscard,
    dealCards,
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