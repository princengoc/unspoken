// src/components/game/GamePhases/SpeakingRemote.tsx
import React, { useState } from "react";
import { Stack, Button, Group, Text, Paper, Title, Modal } from "@mantine/core";
import { IconMessageCircle, IconMicrophone } from "@tabler/icons-react";
import { useFullRoom } from "@/context/FullRoomProvider";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useAuth } from "@/context/AuthProvider";
import { getPlayerAssignments } from "../statusBarUtils";
import { PlayerCardGridRemote, PlayerCardInfo } from "../PlayerCardGridRemote";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import { ListenerReactions } from "../ListenerReactions";

type SpeakingRemoteProp = {
  roomId: string;
};

export function SpeakingRemote({ roomId }: SpeakingRemoteProp) {
  const { user } = useAuth();
  const { finishSpeaking, isCreator } = useFullRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members, currentMember } = useRoomMembers();
  const [recordingForPlayer, setRecordingForPlayer] = useState<string | null>(
    null,
  );
  const [reactionForCard, setReactionForCard] = useState<{
    playerId: string;
    cardId: string;
  } | null>(null);

  const playerAssignments = getPlayerAssignments(members, roomId);

  // Convert selected cards into the format needed for PlayerCardGrid
  const playerCardsInfo: PlayerCardInfo[] = Object.entries(
    cardState.selectedCards,
  )
    .map(([playerId, cardId]) => {
      const player = members.find((m) => m.id === playerId);
      const card = getCardById(cardId);

      if (!card) return null;

      return {
        playerId,
        playerName: player?.username || "Unknown Player",
        playerAssignment: playerAssignments.get(playerId),
        card: card,
      };
    })
    .filter(Boolean) as PlayerCardInfo[];

  const handleReactToCard = (playerId: string, cardId: string) => {
    setReactionForCard({ playerId, cardId });
  };

  const handleRecordForPlayer = (playerId: string) => {
    setRecordingForPlayer(playerId);
  };

  const handleEndReviewingPhase = async () => {
    if (isCreator && currentMember?.id) {
      try {
        await finishSpeaking();
      } catch (error) {
        console.error("Failed to end reviewing phase:", error);
      }
    }
  };

  return (
    <Stack gap="md">
      <Title order={3} ta="center">
        Shared Stories
      </Title>
      <Text ta="center" c="dimmed">
        Review cards and reactions from all players. You can react to cards or
        record audio messages.
      </Text>

      <Paper p="md" withBorder shadow="sm">
        <PlayerCardGridRemote
          cardInfos={playerCardsInfo}
          roomId={roomId}
          showSender={false}
          animate={false}
          highlightPlayerId={currentMember?.id || null}
          playerAssignments={playerAssignments}
          actionButtons={(playerId) => (
            <Group gap="xs">
              <Button
                leftSection={<IconMessageCircle size={16} />}
                size="xs"
                variant="light"
                onClick={() =>
                  handleReactToCard(playerId, cardState.selectedCards[playerId])
                }
              >
                React
              </Button>
              <Button
                leftSection={<IconMicrophone size={16} />}
                size="xs"
                variant="light"
                onClick={() => handleRecordForPlayer(playerId)}
              >
                Record
              </Button>
            </Group>
          )}
        />
      </Paper>

      {isCreator && (
        <Group justify="center" mt="md">
          <Button onClick={handleEndReviewingPhase}>End Reviewing Phase</Button>
        </Group>
      )}

      {/* Reaction Modal */}
      <Modal
        opened={reactionForCard !== null}
        onClose={() => setReactionForCard(null)}
        title="Add Reactions"
        size="sm"
      >
        {reactionForCard && (
          <Stack gap="md">
            <Text size="sm">
              Add reactions to{" "}
              {members.find((m) => m.id === reactionForCard.playerId)?.username}
              's card
            </Text>
            <ListenerReactions
              speakerId={reactionForCard.playerId}
              cardId={reactionForCard.cardId}
              roomId={roomId}
              userId={user.id}
            />
          </Stack>
        )}
      </Modal>

      {/* Recording Modal */}
      <Modal
        opened={recordingForPlayer !== null}
        onClose={() => setRecordingForPlayer(null)}
        title="Record Message"
        size="md"
      >
        {recordingForPlayer && (
          <Stack gap="md">
            <Text size="sm">
              Record an audio message for{" "}
              {members.find((m) => m.id === recordingForPlayer)?.username}
            </Text>
            <AudioRecorder
              targetPlayerId={recordingForPlayer}
              onCancel={() => setRecordingForPlayer(null)}
              onComplete={() => setRecordingForPlayer(null)}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
