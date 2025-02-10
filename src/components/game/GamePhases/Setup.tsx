import { Stack, Button, Text, SimpleGrid, Paper, Group } from '@mantine/core';
import { GameCard } from '../Card';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/core/game/types';
import { useEffect } from 'react';

interface SetupProps {
  playerHands: Record<string, Card[]>;
  selectedCards: Record<string, string>;
  onDealCards: () => Promise<void>;
  onSelectCard: (playerId: string, cardId: string) => void;
  onAddWildCards: () => Promise<void>;
  onStartGame: () => void;
}

export function Setup({ 
  playerHands, 
  selectedCards, 
  onDealCards,
  onSelectCard,
  onAddWildCards,
  onStartGame 
}: SetupProps) {
  const { user } = useAuth();
  if (!user) return null;

  const userHand = playerHands[user.id] || [];
  const hasSelected = !!selectedCards[user.id];
  const allPlayersSelected = Object.keys(playerHands).length > 0 &&
    Object.keys(playerHands).every(playerId => selectedCards[playerId]);

  // When all players have selected their cards, add wild cards to the pool
  useEffect(() => {
    if (allPlayersSelected) {
      onAddWildCards();
    }
  }, [allPlayersSelected]);
  
  return (
    <Stack gap="xl">
      <Text size="lg" fw={500} ta="center">Game Setup</Text>
      
      {!userHand.length && (
        <Button 
          onClick={onDealCards}
          fullWidth
          size="lg"
          variant="filled"
        >
          Deal Cards
        </Button>
      )}
      
      {userHand.length > 0 && !hasSelected && (
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
                onClick={() => !hasSelected && onSelectCard(user.id, card.id)}
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
            {Object.keys(playerHands).map(playerId => (
              <Paper 
                key={playerId}
                p="xs" 
                bg={selectedCards[playerId] ? 'blue.1' : 'gray.1'}
                style={{ minWidth: '100px', textAlign: 'center' }}
              >
                <Text size="sm">
                  {playerId === user.id ? 'You' : 'Player'} 
                  {selectedCards[playerId] ? ' ✓' : ''}
                </Text>
              </Paper>
            ))}
          </Group>
        </>
      )}
      
      {allPlayersSelected && (
        <Button 
          onClick={onStartGame}
          fullWidth
          size="lg"
          variant="filled"
        >
          Start Game
        </Button>
      )}
    </Stack>
  );
}