import { Stack, Button, Text, Group, Paper } from '@mantine/core';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/core/game/types';
import { useGameState } from '@/context/GameStateProvider';
import { CardDeck } from '../CardDeck';
import { FadeIn, SlideIn } from '@/components/animations/Motion';

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

  const stateMachine = useGameState();
  const userHand = playerHands[user.id] || [];
  console.log('Debug userHand:', userHand);
  const hasSelected = !!selectedCards[user.id];
  const allPlayersSelected = Object.keys(playerHands).length > 0 && 
    stateMachine.areAllPlayersSelected();
  
  return (
    <Stack gap="xl">
      <FadeIn>
        <Text size="lg" fw={500} ta="center">Game Setup</Text>
      </FadeIn>
      
      {!userHand.length ? (
        <SlideIn>
          <Button 
            onClick={onDealCards}
            fullWidth
            size="lg"
            variant="filled"
          >
            Deal Cards
          </Button>
        </SlideIn>
      ) : !hasSelected ? (
        <>
          <FadeIn delay={0.2}>
            <Text size="sm" c="dimmed" ta="center">
              Swipe right to select a card for the shared pool
            </Text>
          </FadeIn>
          
          <CardDeck
            cards={userHand}
            onSelect={(card) => onSelectCard(user.id, card.id)}
          />
          
          <SlideIn direction="up">
            <Group justify="center" gap="xs">
              {Object.keys(playerHands).map((playerId, index) => (
                <Paper 
                  key={playerId}
                  p="xs" 
                  bg={selectedCards[playerId] ? 'blue.1' : 'gray.1'}
                  style={{ minWidth: '100px', textAlign: 'center' }}
                >
                  <Text size="sm">
                    {playerId === user.id ? 'You' : `Player ${index + 1}`}
                    {selectedCards[playerId] ? ' ✓' : ''}
                  </Text>
                </Paper>
              ))}
            </Group>
          </SlideIn>
        </>
      ) : allPlayersSelected ? (
        <SlideIn>
          <Button 
            onClick={onStartGame}
            fullWidth
            size="lg"
            variant="filled"
          >
            Start Game
          </Button>
        </SlideIn>
      ) : (
        <FadeIn>
          <Text size="sm" c="dimmed" ta="center">
            Waiting for other players to select their cards...
          </Text>
        </FadeIn>
      )}
    </Stack>
  );
}