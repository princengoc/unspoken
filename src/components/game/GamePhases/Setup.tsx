// src/components/game/GamePhases/Setup.tsx

import { Stack, Text, Group, Button } from '@mantine/core';
import { useAuth } from '@/context/AuthProvider';
import { Card as CardType, PlayerStatus } from '@/core/game/types';
import { useGameState } from '@/context/GameStateProvider';
import { CardDeck } from '../CardDeck';
import { Card } from '../Card';
import { FadeIn, SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';

interface SetupProps {
  playerHands: Record<string, CardType[]>;
  selectedCards: Record<string, string>;
  discardPile: CardType[];
  onDealCards: () => Promise<void>;
  onSelectCard: (cardId: string) => void;
  playerStatus: PlayerStatus;
  sessionId: string;
}

export function Setup({ 
  playerHands, 
  selectedCards, 
  discardPile,
  onDealCards,
  onSelectCard,
  playerStatus,
  sessionId 
}: SetupProps) {
  const { user } = useAuth();
  if (!user) return null;

  const stateMachine = useGameState();
  const userHand = playerHands[user.id] || [];
  const hasSelected = !!selectedCards[user.id];
  
  const renderContent = () => {
    // Player still needs to draw cards
    if (!userHand.length) {
      return (
        <SlideIn>
          <Button 
            onClick={onDealCards}
            fullWidth
            size="lg"
            variant="filled"
          >
            Draw Cards
          </Button>
        </SlideIn>
      );
    }

    // Player is choosing their card
    if (playerStatus === PLAYER_STATUS.CHOOSING) {
      return (
        <>          
          <CardDeck
            cards={userHand}
            onSelect={(card) => onSelectCard(card.id)}
          />
          
          <SlideIn direction="up">
            <Text size="sm" c="dimmed" ta="center">
              Select one card to share when it&apos;s your turn
            </Text>
          </SlideIn>
        </>
      );
    }

    // Player is browsing discarded cards
    if (playerStatus === PLAYER_STATUS.BROWSING) {
      return (
        <>
          <Text size="lg" fw={500} ta="center" mb="md">
            Waiting for other players...
          </Text>
          
          {discardPile.length > 0 ? (
            <Stack gap="md">
              <Text size="sm" c="dimmed" ta="center">
                Browse discarded cards while waiting
              </Text>
              {discardPile.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  index={index}
                  total={discardPile.length}
                  showExchange
                />
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center">
              No cards have been discarded yet
            </Text>
          )}
        </>
      );
    }

    return null;
  };
  
  return (
    <Stack gap="xl">
      <FadeIn>
        <Group justify="space-between" align="center">
          <Text size="lg" fw={500}>Round Setup</Text>
          <Text size="sm" c="dimmed">
            {stateMachine.getState().players.filter(p => p.status === PLAYER_STATUS.BROWSING).length} / {stateMachine.getState().players.length} ready
          </Text>
        </Group>
      </FadeIn>
      
      {renderContent()}
    </Stack>
  );
}