import { useState, useCallback } from "react";
import { Stack, Text, Group, Button, Paper, Box } from "@mantine/core";
import { IconCheck, IconHourglass } from "@tabler/icons-react";
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
  const {
    cardState,
    getCardById,
    getCardsByIds,
    dealCardsToPlayer,
    completePlayerSetup,
  } = useCardsInGame();
  const { currentMember } = useRoomMembers();
  const { room, startSpeakingPhase, isCreator } = useRoom();
  const { isSetupComplete, currentMemberStatus } = useFullRoom();

  const [isDealing, setIsDealing] = useState(false);

  const isRemoteMode = room?.game_mode === "remote";

  const handleDrawCards = async () => {
    if (!currentMember?.id) return;

    setIsDealing(true);
    await dealCardsToPlayer();
    setIsDealing(false);
  };

  // Get the currently selected card to display in waiting view
  const selectedCardId = currentMember?.id
    ? cardState.selectedCards[currentMember.id]
    : null;
  const selectedCard = selectedCardId ? getCardById(selectedCardId) : null;

  const handleRecordComplete = useCallback(async () => {
    try {
      if (!room?.id || !currentMember?.id) return;

      await roomMembersService.updatePlayerState(room.id, currentMember.id, {
        has_spoken: true,
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
            onSelect={completePlayerSetup}
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
                <Text size="md">
                  In your turn, share a story inspired by this card
                </Text>

                {isRemoteMode && (
                  <Box>
                    {currentMember?.has_spoken ? (
                      <Text size="sm" c="dimmed" mt="md">
                        Thanks for telling your story!
                      </Text>
                    ) : (
                      <Paper p="md" withBorder radius="md" shadow="sm" mt="md">
                        <AudioRecorder
                          isPublic={true}
                          onComplete={handleRecordComplete}
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
                onClick={startSpeakingPhase}
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
                  ? `Start ${isRemoteMode ? "Reviewing" : "the Share"}!`
                  : "Others are choosing..."}
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
                      ? "Everyone's ready! Waiting for the game master to start the Share."
                      : "Others are choosing... Why not Ask them with a card?"}
                  </Text>
                </Group>
              </Paper>
            )}
          </Stack>
        );

      case "done":
      default:
        return <div>Loading...</div>;
    }
  };

  // Render the appropriate content based on current view
  return renderContentOnCardsView();
}
