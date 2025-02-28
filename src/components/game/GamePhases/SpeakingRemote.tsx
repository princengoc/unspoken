// src/components/game/GamePhases/SpeakingRemote.tsx
import React from "react";
import { Stack, Button, Text, Paper, Title } from "@mantine/core";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { getPlayerAssignments } from "../statusBarUtils";
import { PlayerCardGridRemote, PlayerCardInfo } from "../PlayerCardGridRemote";
import { useRoom } from "@/context/RoomProvider";

type SpeakingRemoteProp = {
  roomId: string;
};

export function SpeakingRemote({ roomId }: SpeakingRemoteProp) {
  const { finishSpeaking, isCreator } = useRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members, currentMember } = useRoomMembers();

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

  const handleEndReviewingPhase = async () => {
    if (isCreator) {
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
        Review cards and reactions from all players. React or record audio responses directly.
      </Text>

      <Paper p="md" withBorder shadow="sm">
        <PlayerCardGridRemote
          cardInfos={playerCardsInfo}
          showSender={false}
          animate={false}
          highlightPlayerId={currentMember?.id || null}
          playerAssignments={playerAssignments}
        />
      </Paper>

      {isCreator && (
        <Stack align="center" mt="md">
          <Button onClick={handleEndReviewingPhase}>End Reviewing Phase</Button>
        </Stack>
      )}
    </Stack>
  );
}