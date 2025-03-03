// src/components/game/PlayerCardGridRemote.tsx

import React from "react";
import { Group, Text, Box, Stack, Card } from "@mantine/core";
import { SlideIn } from "@/components/animations/Motion";
import { MiniCard } from "./CardDeck/MiniCard";
import { PlayerAssignment } from "./statusBarUtils";
import { Card as CardType } from "@/core/game/types";
import { ReactionsFeed } from "./ReactionsFeed";
import { AudioPlayer } from "@/components/AudioMessage/AudioPlayer";
import { useAuth } from "@/context/AuthProvider";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { Reactions } from "./Reactions";

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
  showSender?: boolean;
  animate?: boolean;
  highlightPlayerId?: string | null;
  title?: string | null;
  playerAssignments: Map<string, PlayerAssignment>;
}

export function PlayerCardGridRemote({
  cardInfos,
  showSender = false,
  animate = true,
  highlightPlayerId = null,
  title = null,
  playerAssignments,
}: PlayerCardGridRemoteProps) {
  const { user } = useAuth();
  const userId = user.id;
  const { messagesByPlayer, loading: audioLoading } = useAudioMessages();

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

          // Get any audio messages for this player
          const audioMessages = messagesByPlayer.get(info.playerId) || [];

          // Is this the current user's card?
          const isCurrentUserCard = info.playerId === userId;

          // Prepare the card component with appropriate props
          const cardContent = (
            <Box>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  {/* The card itself */}
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

                  {/* Reaction feed - shows ALL reactions directed to the current user */}
                  {/* Only show on current user's card */}
                  {isCurrentUserCard && (
                    <ReactionsFeed playerAssignments={playerAssignments} />
                  )}

                  {/* Reaction buttons - for reacting to other people's cards */}
                  {/* Don't show reaction buttons on current user's card */}
                  {!isCurrentUserCard && (
                    <Reactions toId={info.playerId} cardId={info.card.id} />
                  )}

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
                </Stack>
              </Card>
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

      {audioLoading && (
        <Text ta="center" c="dimmed" mt="lg">
          Loading audio messages...
        </Text>
      )}
    </>
  );
}
