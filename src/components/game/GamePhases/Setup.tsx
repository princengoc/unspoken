import { useState } from 'react';
import { Stack, Text, Group, Button, Paper, Transition } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { CardDeck } from '../CardDeck';
import { SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import ScatterDeck from '../CardDeck/ScatterDeck';

export function Setup() {
  const { cardState, getCardsByIds } = useCardsInGame(); 
  const { currentMember, updateMemberStatus, markMemberAsSpoken } = useRoomMembers();
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
  const [noCardsAvailable, setNoCardsAvailable] = useState(false);  

  const handleDrawCards = async () => {
      if (!currentMember?.id) return;
      
      setIsDealing(true);
      try {
          const cards = await dealCards(currentMember.id);
          // If no cards were dealt (eg ripple and exchange-only round)
          // mark the player as ready and spoken immediately
          if (cards.length === 0) {
            setNoCardsAvailable(true);
            await Promise.all([
              updateMemberStatus(currentMember.id, PLAYER_STATUS.BROWSING),
              markMemberAsSpoken(currentMember.id, true)
            ]);
            console.log(`No cards available, marked member as spoken: ${currentMember}`);            
          }
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
    <Stack gap="xl" justify="center">
      {/* Show "Draw Cards" if the player hasn't received any cards */}
      {canStartDrawCards && !noCardsAvailable && (
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

      {/* Show message when player has no cards available in ripple-only round */}
      {noCardsAvailable && (
        <Paper p="md" radius="md">
          <Stack align="center" gap="md">
            <Text size="md">
              You don't have any rippled cards for this round.
            </Text>
            <Text size="sm" c="dimmed">
              You'll participate as a listener in this round.
            </Text>
          </Stack>
        </Paper>
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
        </>
      )}

      {currentMember?.status === PLAYER_STATUS.BROWSING && (
        <Stack gap="xs">
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
            <Paper p="md" radius="md">
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
              {/* TODO: implement onClick for this, which is the exchange feature*/}
              <ScatterDeck cards={getCardsByIds(cardState.discardPile)}/>
            </>
          )}

        </Stack>
      )}
    </Stack>
  );
}