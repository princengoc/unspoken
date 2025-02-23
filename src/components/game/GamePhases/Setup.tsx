// src/components/game/GamePhases/Setup.tsx

import { useState, useEffect } from 'react';
import { Stack, Text, Group, Button, Paper, Transition } from '@mantine/core';
import { notifications } from "@mantine/notifications";
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useFullRoom } from '@/context/FullRoomProvider';
import { CardDeck } from '../CardDeck';
import { SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { ExchangeTab } from '../ExchangeRequests/ExchangeTab';

type SetupViewType = 'cards' | 'exchange' | 'waiting';

type SetupProps = {
  roomId: string | undefined;
  initialView?: SetupViewType;
  onViewChange?: (view: SetupViewType) => void;
}

export function Setup({ initialView = 'cards', onViewChange }: SetupProps) {
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { currentMember, updateMember } = useRoomMembers();
  const { 
    handleCardSelection, 
    initiateSpeakingPhase,
    dealCards,
    canStartDrawCards,
    canStartChoosing,
    isSetupComplete, 
    isCreator
  } = useFullRoom();

  const [isDealing, setIsDealing] = useState(false);
  const [noCardsAvailable, setNoCardsAvailable] = useState(false);
  const [currentView, setCurrentView] = useState<SetupViewType>(initialView);

  // Sync view changes with parent component
  useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);

  useEffect(() => {
    onViewChange?.(currentView);
  }, [currentView, onViewChange]);

  const handleDrawCards = async () => {
    if (!currentMember?.id) return;
      
    setIsDealing(true);
    try {
      const cards = await dealCards(currentMember.id);
      // If no cards were dealt (eg ripple and exchange-only round)
      // mark the player as ready and spoken immediately
      if (cards.length === 0) {
        setNoCardsAvailable(true);
        await updateMember(currentMember.id, {
          status: PLAYER_STATUS.BROWSING, 
          hasSpoken: true
        });
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

  // Get the currently selected card to display in waiting view
  const selectedCardId = currentMember?.id ? cardState.selectedCards[currentMember.id] : null;
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;

  // Render the appropriate content based on current view
  const renderContent = () => {
    // Cards view
    if (currentView === 'cards') {
      if (canStartDrawCards && !noCardsAvailable) {
        return (
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
        );
      }

      if (noCardsAvailable) {
        return (
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
        );
      }

      if (canStartChoosing && currentMember?.id) {
        return (
          <CardDeck 
            cards={getCardsByIds(cardState.playerHands[currentMember.id]) || []} 
            onSelect={handleCardSelection} 
          />
        );
      }
    }

    // Exchange view - only show if we're in the right phase
    if (currentView === 'exchange' ) {
      return <ExchangeTab />;
    }

    // Waiting view
    if (currentView === 'waiting' || currentMember?.status === PLAYER_STATUS.BROWSING) {
      return (
        <Stack gap="md">
          {/* Show selected card if user has made a selection */}
          {selectedCard && currentMember?.status === PLAYER_STATUS.BROWSING && (
            <Paper p="md" radius="md" withBorder mb="md">
              <Stack gap="xs" align="center">
                <Text size="md" fw={500}>Your Selected Card:</Text>
                <Text size="lg" ta="center" py="md">{selectedCard.content}</Text>
                <Text size="sm" c="dimmed">This is the card you'll share during your turn</Text>
              </Stack>
            </Paper>
          )}
          
          {isCreator ? (
            <Stack gap="xs">
              <Text size="sm">
                {isSetupComplete
                  ? "Everyone's ready! You can start the game."
                  : "Waiting for other players to choose their cards..."}
              </Text>              
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
            </Stack>
          ) : (
            <Paper p="md" radius="md">
              <Group align="center" gap="sm">
                <IconHourglass size={20} />
                <Text size="sm">
                  {isSetupComplete
                    ? "Everyone's ready! Waiting for the room creator to start the game."
                    : "Waiting for other players to choose their cards."}
                </Text>
              </Group>
            </Paper>
          )}
        </Stack>
      );
    };

    return null;
  };

  return (
    <Stack gap="xl" justify="center">
      {renderContent()}
    </Stack>
  );
}