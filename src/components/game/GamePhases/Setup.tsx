// src/components/game/GamePhases/Setup.tsx
'use client';
import { Stack, Button, Text, Paper } from '@mantine/core';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useAuth } from '@/context/AuthProvider';

export function Setup() {
  const { user } = useAuth();
  const { cardsInPlay, setGamePhase, dealCards } = useGameStore();
    
  const handleStartGame = async () => {
    if (!user) {
      return;
    }
    try {
      await dealCards(user.id);
      await setGamePhase('speaking');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };
  
  return (
    <Stack gap="md">
      <Text size="lg" fw={500} ta="center">Game Setup</Text>
      
      <div style={{ position: 'relative', minHeight: '24rem', border: '1px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cardsInPlay.length === 0 ? (
          <Text ta="center" c="dimmed">Waiting for cards to be dealt...</Text>
        ) : (
          cardsInPlay.map((card, index) => (
            <div key={card.id} style={{ position: 'absolute', width: '100%' }}>
              <GameCard
                card={card}
                index={index}
                total={cardsInPlay.length}
              />
            </div>
          ))
        )}
      </div>

      <Button 
        onClick={handleStartGame}
        fullWidth
        size="lg"
        variant="filled"
      >
        Deal Cards & Start Game
      </Button>

      {process.env.NODE_ENV === 'development' && (
        <Paper p="xs" withBorder>
          <Text size="sm" c="dimmed">Debug Info:</Text>
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify({
              userPresent: !!user,
              cardsInPlay: cardsInPlay.length,
              userId: user?.id
            }, null, 2)}
          </pre>
        </Paper>
      )}
    </Stack>
  );
}