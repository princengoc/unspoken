import { useState } from 'react';
import { Stack, Text, Group, Button, Paper, Transition } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { CardDeck } from '../CardDeck';
import { Card } from '../Card';
import { FadeIn, SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useCardsInGame } from '@/context/CardsInGameProvider';

type SetupProps = {
  roomId: string;
}

export function Setup({roomId }: SetupProps) {
  const { cardState, getCardById, getCardsByIds } = useCardsInGame(); 
  const { members, currentMember } = useRoomMembers();
  const { 
    handleCardSelection, 
    initiateSpeakingPhase,
    dealCards,
    canStartDrawCards,
    canStartChoosing,
    isSetupComplete, 
    isCreator
  } = useRoom();

  const [isDealing, setIsDealing] = useState(false);

  const handleDrawCards = async () => {
      if (!currentMember?.id) return;
      
      setIsDealing(true);
      try {
          await dealCards(currentMember.id);
      } catch (error) {
          notifications.show({
              title: 'Error',
              message: 'Failed to draw cards. Please try again.',
              color: 'red'
          });
          console.error('Failed to draw cards:', error);
      } finally {
          setIsDealing(false);
      }
  };

  return (
    <Stack gap="xl">
      <FadeIn>
        <Group justify="space-between" align="center">
          <Text size="lg" fw={500}>
            Round Setup
          </Text>
          <Text size="sm" c="dimmed">
            {members.filter((p) => p.status === PLAYER_STATUS.BROWSING).length} / {members.length} ready
          </Text>
        </Group>
      </FadeIn>

      {/* Show "Draw Cards" if the player hasn't received any cards */}
      {canStartDrawCards && (
        <SlideIn>
            <Button 
                onClick={handleDrawCards} 
                fullWidth 
                size="lg" 
                variant="filled"
                loading={isDealing}
            >
                Draw Cards
            </Button>
        </SlideIn>
      )}

      {/* When cards are available: either allow selection or wait */}
      {canStartChoosing && (
        <>
          {currentMember?.id && (
            <CardDeck 
              cards={getCardsByIds(cardState.playerHands[currentMember.id]) || []} 
              onSelect={handleCardSelection} 
            />
          )}
          <SlideIn direction="up">
            <Text size="sm" c="dimmed" ta="center">
              Select one card to share when it&apos;s your turn
            </Text>
          </SlideIn>
        </>
      )}

      {currentMember?.status === PLAYER_STATUS.BROWSING && (
        <Stack gap="lg">
          {isCreator ? (
            <Transition mounted={isSetupComplete} transition="slide-up">
              {(styles) => (
                <Button
                  style={styles}
                  fullWidth
                  size="lg"
                  onClick={initiateSpeakingPhase}
                  leftSection={<IconCheck size={18} />}
                >
                  Start Game
                </Button>
              )}
            </Transition>
          ) : (
            <Paper p="md" radius="md" withBorder>
              <Group align="center" gap="sm">
                <IconHourglass size={18} />
                <Text size="sm">
                  {isSetupComplete
                    ? "Everyone's ready! Waiting for the room creator to start the game..."
                    : "Waiting for other players to choose their cards..."}
                </Text>
              </Group>
            </Paper>
          )}

          {cardState.discardPile.length > 0 && (
            <>
              <Text size="sm" c="dimmed" ta="center">
                Browse discarded cards while waiting
              </Text>
              <Stack gap="md">
                {cardState.discardPile.map((cardId, index) => {
                  const card = getCardById(cardId);
                  return card ? (
                    <Card 
                      key={cardId} 
                      card={card} 
                      index={index} 
                      total={cardState.discardPile.length} 
                      showExchange 
                    />
                  ) : null;
                })}
              </Stack>
            </>
          )}

        </Stack>
      )}
    </Stack>
  );
}