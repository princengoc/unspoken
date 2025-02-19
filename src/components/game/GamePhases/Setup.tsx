import { useState } from 'react';
import { Stack, Text, Group, Button, Paper, Transition, Tabs } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { IconCheck, IconHourglass, IconCards, IconExchange } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { CardDeck } from '../CardDeck';
import { SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useCardsInGame } from '@/context/CardsInGameProvider';
//import ScatterDeck from '../CardDeck/ScatterDeck';
import { MiniDeck } from '../CardDeck/MiniDeck';
import { ExchangeTab } from '../ExchangeRequests/ExchangeTab';

type SetupProp = {
  roomId: string
}

export function Setup( { roomId }: SetupProp) {
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
  const [activeTab, setActiveTab] = useState<string | null>("cards");

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

      {/* When cards are available: show tabs for card selection and exchanges */}
      {canStartChoosing && currentMember?.id && (
        <Tabs defaultValue="cards" value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="cards" leftSection={<IconCards size={16} />}>My Cards</Tabs.Tab>
            <Tabs.Tab value="exchanges" leftSection={<IconExchange size={16} />}>Exchange</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="cards" pt="md">
            <CardDeck 
              cards={getCardsByIds(cardState.playerHands[currentMember.id]) || []} 
              onSelect={handleCardSelection} 
            />
          </Tabs.Panel>

          <Tabs.Panel value="exchanges" pt="md">
            {roomId && (
              <ExchangeTab roomId={roomId} />
            )}
          </Tabs.Panel>
        </Tabs>
      )}

    {currentMember?.status === PLAYER_STATUS.BROWSING && (
      <Stack gap="xs">
        <Tabs>
          <Tabs.List>
            <Tabs.Tab value="waiting" leftSection={<IconHourglass size={16} />}>Waiting</Tabs.Tab>
            <Tabs.Tab value="exchanges" leftSection={<IconExchange size={16} />}>Exchange</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="waiting" pt="md">
            {/* Existing waiting content */}
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

            {/* Discarded cards section */}
            {cardState.discardPile.length > 0 && (
              <>
                <Text size="sm" c="dimmed" ta="center" mt="md">
                  Browse discarded cards while waiting
                </Text>
                <MiniDeck cards={getCardsByIds(cardState.discardPile)}/>
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="exchanges" pt="md">
            {roomId && (
              <ExchangeTab roomId={roomId} />
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    )}
    </Stack>
  );
}