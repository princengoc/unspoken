// src/components/game/GamePhases/Setup.tsx

import { useState, useEffect } from 'react';
import { Stack, Text, Group, Button, Paper, Transition } from '@mantine/core';
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useFullRoom } from '@/context/FullRoomProvider';
import { CardDeck } from '../CardDeck';
import { SlideIn } from '@/components/animations/Motion';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { ExchangeTab } from '../ExchangeRequests/ExchangeTab';
import { SetupViewType } from '@/core/game/types';

type SetupProps = {
  roomId: string | undefined;
  initialView?: SetupViewType;
  onViewChange?: (view: SetupViewType) => void;
}

export function Setup({ initialView = 'cards', onViewChange }: SetupProps) {
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { currentMember } = useRoomMembers();
  const { 
    handleCardSelection, 
    initiateSpeakingPhase,
    dealCards,
    isSetupComplete, 
    isCreator, 
    currentMemberStatus
  } = useFullRoom();

  const [isDealing, setIsDealing] = useState(false);
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
    await dealCards(currentMember.id);
    setIsDealing(false);
  };

  // Get the currently selected card to display in waiting view
  const selectedCardId = currentMember?.id ? cardState.selectedCards[currentMember.id] : null;
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;

  const renderContentOnCardsView = () => {
    switch (currentMemberStatus) {
      case 'drawing':
        // Show button to draw cards
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

      case 'choosing':
        // Show CardDeck to choose from
        return (
          <CardDeck 
            cards={getCardsByIds(cardState.playerHands[currentMember!.id]) || []} 
            onSelect={handleCardSelection} 
          />
        );

      case 'browsing':
        // Show waiting view + selected card
        return (
          <Stack gap="md">
            { selectedCard && (
            <Paper p="md" radius="md" withBorder mb="md">
              <Stack gap="xs" align="center">
                <Text size="md" fw={500}>Your Selected Card:</Text>
                <Text size="lg" ta="center" py="md">{selectedCard.content}</Text>
                <Text size="sm" c="dimmed">This is the card you'll share during your turn</Text>
              </Stack>
            </Paper> 
            )
            }
            
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

      case 'done':
      default: 
        // Handle edge case - shouldn't happen in setup
        return <div>Loading...</div>;
    }    
  }

  // Render the appropriate content based on current view
  return (
    <Stack gap="xl" justify="center">
      {currentView === 'exchange' ? <ExchangeTab /> : renderContentOnCardsView()}
    </Stack>
  );
}