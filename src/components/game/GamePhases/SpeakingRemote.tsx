// src/components/game/GamePhases/SpeakingRemote.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Stack,
  Button,
  Text,
  Paper,
  Title,
  Tabs,
  Group,
  Box,
  Badge,
  ActionIcon,
  Divider,
} from "@mantine/core";
import {
  IconUser,
  IconMicrophone,
  IconArrowBarRight,
} from "@tabler/icons-react";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useRoom } from "@/context/RoomProvider";
import { PlayerAvatar } from "../PlayerAvatar";
import { getPlayerAssignments } from "../statusBarUtils";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import { ConversationThread } from "./ConversationThread";
import { PlayerAssignment } from "../statusBarUtils";
import { Card } from "@/core/game/types";

type SpeakingRemoteProp = {
  roomId: string;
};

interface TabItem {
  value: string;
  label: string;
  playerAssignment: PlayerAssignment | undefined;
  isCurrentUser: boolean;
  hasUnreadMessages: boolean;
  card: Card;
}

export function SpeakingRemote({ roomId }: SpeakingRemoteProp) {
  const { finishSpeaking, isCreator } = useRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members, currentMember } = useRoomMembers();
  const {
    messagesByCard,
    loading: audioLoading,
    recording,
    setRecording,
  } = useAudioMessages();

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const playerAssignments = getPlayerAssignments(members, roomId);

  // Create a simple mapping of cards to players for easy lookup
  const cardPlayerMap = useMemo(
    () =>
      Object.entries(cardState.selectedCards).reduce(
        (map, [playerId, cardId]) => {
          map[cardId] = playerId;
          return map;
        },
        {} as Record<string, string>,
      ),
    [cardState.selectedCards],
  );

  // Create tab items from all cards
  const tabItems: TabItem[] = useMemo(
    () =>
      Object.entries(cardState.selectedCards)
        .map(([playerId, cardId]) => {
          const player = members.find((m) => m.id === playerId);
          const card = getCardById(cardId);
          if (!card) return null;

          const playerAssignment = playerAssignments.get(playerId);
          const isCurrentUser = playerId === currentMember?.id;

          // Check if there are unread messages for this card
          const cardMessages = messagesByCard.get(cardId) || [];
          const hasUnreadMessages = cardMessages.some(
            (msg) => msg.sender_id !== currentMember?.id,
          );

          return {
            value: cardId,
            label: player?.username || "Unknown Player",
            playerAssignment,
            isCurrentUser,
            hasUnreadMessages,
            card,
          };
        })
        .filter((item): item is TabItem => item !== null),
    [
      cardState.selectedCards,
      members,
      getCardById,
      playerAssignments,
      messagesByCard,
      currentMember?.id,
    ],
  );

  const activeCardMessages = useMemo(
    () => (activeTab ? messagesByCard.get(activeTab) || [] : []),
    [activeTab, messagesByCard],
  );

  // Set first tab as active by default
  useEffect(() => {
    if (Object.keys(cardState.selectedCards).length > 0 && !activeTab) {
      // If current user's card exists, select it first
      const currentUserCardId =
        cardState.selectedCards[currentMember?.id || ""];
      if (currentUserCardId) {
        setActiveTab(currentUserCardId);
      } else {
        // Otherwise, select the first card
        const firstPlayerId = Object.keys(cardState.selectedCards)[0];
        setActiveTab(cardState.selectedCards[firstPlayerId]);
      }
    }
  }, [cardState.selectedCards, activeTab, currentMember?.id]);

  const handleEndReviewingPhase = async () => {
    if (isCreator) {
      try {
        await finishSpeaking();
      } catch (error) {
        console.error("Failed to end reviewing phase:", error);
      }
    }
  };

  const handleRecordToggle = useCallback(() => {
    setIsRecording(true);
    setRecording(true);
  }, [setRecording]);

  const handleRecordComplete = () => {
    setIsRecording(false);
    setRecording(false);
  };

  // Render the conversation interface for the active tab
  const renderActiveCardContent = () => {
    if (!activeTab) return null;

    const playerId = cardPlayerMap[activeTab];
    const card = getCardById(activeTab);
    const player = members.find((m) => m.id === playerId);

    if (!card || !player) return null;

    const isCurrentUserCard = playerId === currentMember?.id;

    return (
      <Stack gap="sm">
        {/* Card Preview */}
        <Paper p="md" withBorder shadow="sm" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Text fw={600} size="md" style={{ flex: 1 }}>
              "{card.content}"
              {isCurrentUserCard && (
                <Badge component="span" size="xs" color="blue" ml="xs">
                  Your card
                </Badge>
              )}
            </Text>

            <ActionIcon
              variant="light"
              color="blue"
              onClick={() => !isRecording && handleRecordToggle()}
              disabled={recording}
              radius="xl"
              size="lg"
            >
              <IconMicrophone size={18} />
            </ActionIcon>
          </Group>

          {/* Recording Interface */}
          {isRecording && (
            <>
              <Divider my="md" />
              <AudioRecorder
                isPublic={true}
                targetPlayerId={playerId}
                cardId={activeTab}
                onComplete={handleRecordComplete}
              />
            </>
          )}
        </Paper>

        {/* Conversation Thread as a separate component */}
        <ConversationThread
          cardId={activeTab}
          playerId={playerId}
          messages={activeCardMessages}
          members={members}
          currentMemberId={currentMember?.id || ""}
          playerAssignments={playerAssignments}
        />
      </Stack>
    );
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={4}>Conversations</Title>
        {isCreator && (
          <Button
            size="sm"
            onClick={handleEndReviewingPhase}
            variant="outline"
            rightSection={<IconArrowBarRight size={16} />}
          >
            End Conversations
          </Button>
        )}
      </Group>

      {audioLoading ? (
        <Text ta="center" c="dimmed">
          Loading conversations...
        </Text>
      ) : (
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          keepMounted={false}
          variant="pills"
        >
          <Tabs.List>
            {tabItems.map((item) => (
              <Tabs.Tab
                key={item.value}
                value={item.value}
                leftSection={
                  item.playerAssignment ? (
                    <PlayerAvatar
                      assignment={item.playerAssignment}
                      size="xs"
                      highlighted={item.isCurrentUser}
                    />
                  ) : (
                    <IconUser size={16} />
                  )
                }
                rightSection={
                  item.hasUnreadMessages ? (
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: "red",
                      }}
                    />
                  ) : null
                }
              >
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Box pt="md">{renderActiveCardContent()}</Box>
        </Tabs>
      )}
    </Stack>
  );
}
