// src/components/game/GamePhases/Setup.tsx
'use client';
import { Stack, Button } from '@mantine/core';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useAuth } from '@/context/AuthProvider';

export function Setup() {
  const { user } = useAuth();
  const { cardsInPlay, setGamePhase, dealCards } = useGameStore();
  
  const handleStartGame = async () => {
    if (!user) return;
    await dealCards(user.id);
    await setGamePhase('speaking');
  };
  
  return (
    <Stack gap="md">
      <div style={{ position: 'relative', height: '24rem' }}>
        {cardsInPlay.map((card, index) => (
          <div key={card.id} style={{ position: 'absolute', width: '100%' }}>
            <GameCard
              card={card}
              index={index}
              total={cardsInPlay.length}
            />
          </div>
        ))}
      </div>

      <Button 
        onClick={handleStartGame}
        disabled={cardsInPlay.length === 0}
      >
        Start Game
      </Button>
    </Stack>
  );
}