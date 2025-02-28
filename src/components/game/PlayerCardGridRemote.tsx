// src/components/game/PlayerCardGridRemote.tsx
import React from "react";
import { Group, Text, Box, Stack } from "@mantine/core";
import { SlideIn } from "@/components/animations/Motion";
import { MiniCard } from "./CardDeck/MiniCard";
import { PlayerAssignment } from "./statusBarUtils";
import { Card as CardType } from "@/core/game/types";
import { ReactionsFeed } from "./ReactionsFeed";
import { AudioPlayer } from "@/components/AudioMessage/AudioPlayer";
import { useAuth } from "@/context/AuthProvider";
import { useAudioMessages } from "@/context/AudioMessagesProvider";

export interface PlayerCardInfo {
  playerId: string;
  playerName: string;
  playerAssignment?: PlayerAssignment;
  card: CardType;
  contributorId?: string;
  contributorName?: string | null;
  contributorAssignment?: PlayerAssignment;
}

interface PlayerCardGridRemoteProps {
  cardInfos: PlayerCardInfo[];
  roomId: string;
  showSender?: boolean;
  animate?: boolean;
  highlightPlayerId?: string | null;
  title?: string | null;
  actionButtons?: (playerId: string) => React.ReactNode;
  playerAssignments: Map<string, PlayerAssignment>;
}

export function PlayerCardGridRemote({
  cardInfos,
  roomId,
  showSender = false,
  animate = true,
  highlightPlayerId = null,
  title = null,
  actionButtons,
  playerAssignments,
}: PlayerCardGridRemoteProps) {
  const { user } = useAuth();
  const { messagesByPlayer, loading } = useAudioMessages();

  return (
    <>
      {title && (
        <Text fw={500} mb="xs">
          {title}
        </Text>
      )}
      <Group align="start" justify="center" gap="xl">
        {cardInfos.map((info, index) => {
          // Filter out undefined/null cards
          if (!info.card) return null;

          // Check if this card should be highlighted
          const isHighlighted = highlightPlayerId
            ? info.playerId === highlightPlayerId
            : false;

          // Get any audio messages for this card
          const audioMessages = messagesByPlayer.get(info.playerId) || [];

          // Prepare the card component with appropriate props
          const cardContent = (
            <Box>
              <MiniCard
                key={`card-${info.playerId}`}
                card={info.card}
                showSender={showSender}
                isHighlighted={isHighlighted}
                playerAssignment={info.playerAssignment}
                playerName={info.playerName}
                contributorAssignment={info.contributorAssignment}
                contributorName={info.contributorName}
              />

              {/* Render action buttons if provided */}
              {actionButtons && !isHighlighted && (
                <Box mt="xs">{actionButtons(info.playerId)}</Box>
              )}

              {/* Render ReactionsFeed for this card */}
              <Box mt="sm">
                <ReactionsFeed
                  roomId={roomId}
                  speakerId={info.playerId}
                  cardId={info.card.id}
                  currentUserId={user.id}
                  playerAssignments={playerAssignments || new Map()}
                />
              </Box>

              {/* Render Audio Messages for this card */}
              {audioMessages.length > 0 && (
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    Replies from {info.playerName} ({audioMessages.length})
                  </Text>
                  {audioMessages.map((message) => (
                    <AudioPlayer key={message.id} message={message} />
                  ))}
                </Stack>
              )}
            </Box>
          );

          // Apply animation if needed
          return animate ? (
            <SlideIn key={info.playerId + index} delay={index * 0.1}>
              {cardContent}
            </SlideIn>
          ) : (
            <div key={info.playerId + index}>{cardContent}</div>
          );
        })}
      </Group>

      {loading && (
        <Text ta="center" c="dimmed" mt="lg">
          Loading audio messages...
        </Text>
      )}
    </>
  );
}
