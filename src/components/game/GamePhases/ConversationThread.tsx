// src/components/game/GamePhases/ConversationThread.tsx
import React, { memo, useMemo } from "react";
import {
  Stack,
  Text,
  Paper,
  Group,
  Box,
  ScrollArea,
  Flex,
} from "@mantine/core";
import { formatRelativeTime } from "@/core/game/utils";
import { IconMessage } from "@tabler/icons-react";
import { PlayerAvatar } from "../PlayerAvatar";
import { AudioPlayer } from "@/components/AudioMessage/AudioPlayer";
import { Player } from "@/core/game/types";
import { PlayerAssignment } from "../statusBarUtils";
import { AudioMessage } from "@/core/audio/types";

type ConversationThreadProps = {
  cardId: string;
  playerId: string;
  messages: AudioMessage[]; // Replace with actual message type
  members: Player[];
  currentMemberId: string;
  playerAssignments: Map<string, PlayerAssignment>;
};

// Create a memoized message component to prevent unnecessary re-renders
const MessageItem = memo(function MessageItem({
  message,
  sender,
  isSelf,
  senderAssignment,
}: {
  message: AudioMessage;
  sender?: Player;
  isSelf: boolean;
  senderAssignment?: PlayerAssignment;
}) {
  return (
    <Box
      key={message.id}
      style={{
        alignSelf: isSelf ? "flex-end" : "flex-start",
        maxWidth: "85%",
      }}
    >
      <Paper p="xs" radius="md" bg={isSelf ? "blue.0" : "gray.0"} withBorder>
        <Group gap="xs" mb="xs" wrap="nowrap" align="center">
          {senderAssignment && (
            <PlayerAvatar assignment={senderAssignment} size="xs" />
          )}
          <Text size="xs" c="dimmed">
            {isSelf ? "You" : sender?.username || "Unknown"}
          </Text>
        </Group>
        <AudioPlayer key={message.id} message={message} />
      </Paper>
    </Box>
  );
});

export function ConversationThread({
  messages,
  members,
  currentMemberId,
  playerAssignments,
}: ConversationThreadProps) {
  // Sort messages by creation time - moved to useMemo for performance
  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [messages],
  );

  const lastMessageTime = useMemo(() => {
    if (sortedMessages.length === 0) return null;
    return formatRelativeTime(
      new Date(sortedMessages[sortedMessages.length - 1].created_at),
    );
  }, [sortedMessages]);

  return (
    <Paper p="md" withBorder shadow="sm" radius="md">
      <Group justify="space-between" mb="xs">
        <Text fw={500} size="sm">
          Conversation
        </Text>
        <Text size="xs" c="dimmed">
          {sortedMessages.length} new •{" since "}
          {lastMessageTime ? lastMessageTime : ""}
        </Text>
      </Group>

      <ScrollArea h={350} offsetScrollbars scrollbarSize={6}>
        <Stack gap="sm">
          {sortedMessages.length === 0 ? (
            <Flex direction="column" align="center" justify="center" h={200}>
              <IconMessage size={24} opacity={0.3} />
              <Text c="dimmed" ta="center" size="sm" mt="xs">
                No messages yet. Tap the microphone to begin.
              </Text>
            </Flex>
          ) : (
            sortedMessages.map((message) => {
              const sender = members.find((m) => m.id === message.sender_id);
              const isSelf = message.sender_id === currentMemberId;
              const senderAssignment = playerAssignments.get(message.sender_id);

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  sender={sender}
                  isSelf={isSelf}
                  senderAssignment={senderAssignment}
                />
              );
            })
          )}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}
