import { useState, useCallback } from "react";
import { Stack, Text, Group, Button, Paper, Box } from "@mantine/core";
import { IconCheck, IconHourglass, IconMicrophone } from "@tabler/icons-react";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useFullRoom } from "@/context/FullRoomProvider";
import { SlideIn } from "@/components/animations/Motion";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { CardDeck } from "../CardDeck";
import { Card as GameCard } from "../Card";
import { useRoom } from "@/context/RoomProvider";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import { roomMembersService } from "@/services/supabase/roomMembers";

export function Setup() {
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { currentMember } = useRoomMembers();
  const { room } = useRoom();
  const {
    handleCardSelection,
    initiateSpeakingPhase,
    dealCards,
    isSetupComplete,
    isCreator,
    currentMemberStatus,
  } = useFullRoom();

  const [isDealing, setIsDealing] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const isRemoteMode = room?.game_mode === "remote";

  const handleDrawCards = async () => {
    if (!currentMember?.id) return;

    setIsDealing(true);
    await dealCards(currentMember.id);
    setIsDealing(false);
  };

  // Get the currently selected card to display in waiting view
  const selectedCardId = currentMember?.id
    ? cardState.selectedCards[currentMember.id]
    : null;
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;

  const handleRecordComplete = useCallback(async () => {
    setShowRecorder(false);
    try {
      if (!room?.id || !currentMember?.id) return;
      
      await roomMembersService.updatePlayerState(room.id, currentMember.id, {
        has_spoken: true
      });
    } catch (error) {
      console.error("Failed to update player status:", error);
    }
  }, [room?.id, currentMember?.id]);
  

  const renderContentOnCardsView = () => {
    switch (currentMemberStatus) {
      case "drawing":
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

      case "choosing":
        // Show CardDeck to choose from
        return (
          <CardDeck
            cards={
              getCardsByIds(cardState.playerHands[currentMember!.id]) || []
            }
            onSelect={handleCardSelection}
          />
        );

      case "browsing":
        // Show waiting view + selected card
        // In remote mode, also show option to record audio message
        return (
          <Stack gap="md">
            {selectedCard && (
              <Stack gap="xs" align="center">
                <Text size="md" fw={500}>
                  Your Selected Card:
                </Text>
                <GameCard card={selectedCard} />
                <Text size="sm" c="dimmed">
                  This is the card you'll share during your turn
                </Text>
                
                {isRemoteMode && (
                  <Box>
                    {!showRecorder && !currentMember?.has_spoken ? (
                      <Button 
                        leftSection={<IconMicrophone size={16} />}
                        onClick={() => setShowRecorder(true)}
                        mt="md"
                      >
                        Record Your Story
                      </Button>
                    ) : currentMember?.has_spoken ? (
                      <Text size="sm" c="dimmed" mt="md">
                        Your recording has been submitted
                      </Text>
                    ) : (
                      <Paper p="md" withBorder radius="md" shadow="sm" mt="md">
                        <AudioRecorder 
                          isPublic={true} 
                          onComplete={handleRecordComplete}
                          onCancel={() => setShowRecorder(false)}
                        />
                      </Paper>
                    )}
                  </Box>
                )}
              </Stack>
            )}

            {isCreator ? (
              <Button
                fullWidth
                size="lg"
                onClick={initiateSpeakingPhase}
                disabled={!isSetupComplete}
                leftSection={
                  isSetupComplete ? (
                    <IconCheck size={18} />
                  ) : (
                    <IconHourglass size={18} />
                  )
                }
              >
                {isSetupComplete
                  ? `Start ${isRemoteMode ? "Reviewing" : "the game"}!`
                  : "Players choosing cards..."}
              </Button>
            ) : (
              <Paper p="md" radius="md">
                <Group align="center" gap="sm">
                  {isSetupComplete ? (
                    <IconCheck size={18} />
                  ) : (
                    <IconHourglass size={18} />
                  )}
                  <Text size="sm">
                    {isSetupComplete
                      ? "Everyone's ready! Waiting for the room creator to start."
                      : "Waiting for other players to choose their cards."}
                  </Text>
                </Group>
              </Paper>
            )}
          </Stack>
        );

      case "done":
      default:
        // Handle edge case - shouldn't happen in setup
        return <div>Loading...</div>;
    }
  };

  // Render the appropriate content based on current view
  return renderContentOnCardsView();
}