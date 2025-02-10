'use client';
import { Stack, Button, Text, SimpleGrid, Paper, Group } from '@mantine/core';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useAuth } from '@/context/AuthProvider';

export function Setup() {
  const { user } = useAuth();
  const { 
    players,
    playerHands,
    selectedCards,
    gameStage,
    cardsInPlay,
    dealInitialCards,
    selectCardForPool,
    startMainPhase
  } = useGameStore();
  
  const userHand = user ? playerHands[user.id] || [] : [];
  const hasSelected = user ? !!selectedCards[user.id] : false;
  const allPlayersSelected = players.every(p => selectedCards[p.id]);
  
  const handleStartGame = async () => {
    if (!user) return;
    await dealInitialCards();
  };
  
  const handleSelectCard = async (cardId: string) => {
    if (!user) return;
    await selectCardForPool(user.id, cardId);
  };
  
  const handleStartMainPhase = async () => {
    await startMainPhase();
  };
  
  return (
    <Stack gap="xl">
      <Text size="lg" fw={500} ta="center">Game Setup</Text>
      
      {gameStage === 'dealing' && (
        <Button 
          onClick={handleStartGame}
          fullWidth
          size="lg"
          variant="filled"
        >
          Deal Cards
        </Button>
      )}
      
      {gameStage === 'selecting' && (
        <>
          <Text size="sm" c="dimmed" ta="center">
            Select one card to add to the shared pool
          </Text>
          
          <SimpleGrid cols={3}>
            {userHand.map((card, index) => (
              <div 
                key={card.id}
                style={{ 
                  opacity: hasSelected ? 0.5 : 1,
                  cursor: hasSelected ? 'default' : 'pointer'
                }}
                onClick={() => !hasSelected && handleSelectCard(card.id)}
              >
                <GameCard
                  card={card}
                  index={index}
                  total={userHand.length}
                />
              </div>
            ))}
          </SimpleGrid>
          
          <Group justify="center" gap="xs">
            {players.map(player => (
              <Paper 
                key={player.id}
                p="xs" 
                bg={selectedCards[player.id] ? 'blue.1' : 'gray.1'}
                style={{ minWidth: '100px', textAlign: 'center' }}
              >
                <Text size="sm">
                  {player.id === user?.id ? 'You' : 'Player'} 
                  {selectedCards[player.id] ? ' ✓' : ''}
                </Text>
              </Paper>
            ))}
          </Group>
        </>
      )}
      
      {gameStage === 'ready' && (
        <>
          <Text size="sm" c="dimmed" ta="center">
            Cards in Play ({cardsInPlay.length})
          </Text>
          
          <div style={{ position: 'relative', minHeight: '24rem' }}>
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
            onClick={handleStartMainPhase}
            fullWidth
            size="lg"
            variant="filled"
            disabled={!allPlayersSelected}
          >
            Start Game
          </Button>
        </>
      )}
    </Stack>
  );
}