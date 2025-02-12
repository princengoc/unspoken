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
  isSpeakerSharing: boolean;

  // Card management
  cardsInPlay: Card[];
  discardPile: Card[];
  
  // Phase actions
  setPhase: (phase: GamePhase) => Promise<void>;
  setActivePlayer: (playerId: string | null) => Promise<void>;
  
  // Round management
  startNewRound: () => Promise<void>;
  completeRound: () => Promise<void>;
  
  // Card actions
  addCardToPlay: (card: Card) => Promise<void>;
  moveCardToDiscard: (cardId: string) => Promise<void>;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

interface GameStateProviderProps {
  roomId: string;
  gameStateId: string;
  children: ReactNode;
}

export function GameStateProvider({ roomId, gameStateId, children }: GameStateProviderProps) {
  const [gameState, setGameState] = useState<GameState>({
    id: gameStateId, 
    room_id: roomId,
    phase: 'setup',
    currentRound: 1,
    totalRounds: DEFAULT_TOTAL_ROUNDS,
    activePlayerId: null,
    isSpeakerSharing: false,
    cardsInPlay: [],
    discardPile: [],
  });

  // Set up real-time sync
  useEffect(() => {
    // Initial fetch
    const fetchGameState = async () => {
      try {
        const initialState = await gameStatesService.get(gameStateId);
        setGameState(initialState);
      } catch (error) {
        console.error('Failed to fetch game state:', error);
      }
    };
    fetchGameState();

    // Subscribe to changes
    const subscription = gameStatesService.subscribeToChanges(
      gameStateId,
      (updatedState) => {
        setGameState(updatedState);
      }
    );

    // Cleanup
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [gameStateId]);

  // Phase management actions
  const setPhase = async (phase: GamePhase) => {
    try {
      await gameStatesService.update(gameStateId, { phase });
      setGameState(prev => ({ ...prev, phase }));
    } catch (error) {
      console.error('Failed to update game phase:', error);
      throw error;
    }
  };

  const setActivePlayer = async (playerId: string | null) => {
    try {
      await gameStatesService.update(gameStateId, { activePlayerId: playerId });
      setGameState(prev => ({ ...prev, activePlayerId: playerId }));
    } catch (error) {
      console.error('Failed to set active player:', error);
      throw error;
    }
  };

  // Round management actions
  const startNewRound = async () => {
    try {
      const updates = {
        phase: 'setup' as GamePhase,
        currentRound: gameState.currentRound + 1,
        activePlayerId: null,
        cardsInPlay: [],
        discardPile: [],
        isSpeakerSharing: false,
      };
      
      await gameStatesService.update(gameStateId, updates);
      setGameState(prev => ({ ...prev, ...updates }));
    } catch (error) {
      console.error('Failed to start new round:', error);
      throw error;
    }
  };

  const completeRound = async () => {
    if (gameState.currentRound >= gameState.totalRounds) {
      // Handle game completion
      return;
    }
    await startNewRound();
  };

  // Card management actions
  const addCardToPlay = async (card: Card) => {
    try {
      const updatedCards = [...gameState.cardsInPlay, card];
      await gameStatesService.update(gameStateId, { cardsInPlay: updatedCards });
      setGameState(prev => ({ ...prev, cardsInPlay: updatedCards }));
    } catch (error) {
      console.error('Failed to add card to play:', error);
      throw error;
    }
  };

  const moveCardToDiscard = async (cardId: string) => {
    try {
      const cardToMove = gameState.cardsInPlay.find(c => c.id === cardId);
      if (!cardToMove) return;

      const updatedCardsInPlay = gameState.cardsInPlay.filter(c => c.id !== cardId);
      const updatedDiscardPile = [...gameState.discardPile, cardToMove];

      await gameStatesService.update(gameStateId, {
        cardsInPlay: updatedCardsInPlay,
        discardPile: updatedDiscardPile,
      });

      setGameState(prev => ({
        ...prev,
        cardsInPlay: updatedCardsInPlay,
        discardPile: updatedDiscardPile,
      }));
    } catch (error) {
      console.error('Failed to move card to discard:', error);
      throw error;
    }
  };

  const value = {
    // State
    ...gameState,
    
    // Phase actions
    setPhase,
    setActivePlayer,
    
    // Round management
    startNewRound,
    completeRound,
    
    // Card actions
    addCardToPlay,
    moveCardToDiscard,
  };

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

// Hook for using game state context
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}