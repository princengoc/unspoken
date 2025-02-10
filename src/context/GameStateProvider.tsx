// src/context/GameStateProvider.tsx
import { createContext, useContext, ReactNode, useState } from 'react';
import { GameStateMachine } from '@/core/game/stateMachine';
import { Player } from '@/core/game/types';

const GameStateContext = createContext<GameStateMachine | null>(null);

export function GameStateProvider({ 
  children,
  players 
}: { 
  children: ReactNode;
  players: Player[];
}) {
  const [stateMachine] = useState(() => new GameStateMachine(players));

  return (
    <GameStateContext.Provider value={stateMachine}>
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