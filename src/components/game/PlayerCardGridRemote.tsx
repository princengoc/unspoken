// src/components/game/PlayerCardGridRemote.tsx
import React, { useEffect, useState } from "react";
import { Group, Text, Box, Paper, Stack } from "@mantine/core";
import { SlideIn } from "@/components/animations/Motion";
import { MiniCard } from "./CardDeck/MiniCard";
import { PlayerAssignment } from "./statusBarUtils";
import { Card as CardType } from "@/core/game/types";
import { ReactionsFeed } from "./ReactionsFeed";
import { AudioMessage } from "@/core/audio/types";
import { AudioPlayer } from "@/components/AudioMessage/AudioPlayer";
import { audioMessagesService } from "@/services/supabase/audio-messages";
import { useAuth } from "@/context/AuthProvider";

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
  const [cardAudios, setCardAudios] = useState<Map<string, AudioMessage[]>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);

  // Load all audio messages for each card
  useEffect(() => {
    const fetchAllAudios = async () => {
      setLoading(true);
      const newCardAudios = new Map<string, AudioMessage[]>();

      try {
        // Get all public audio messages for the room
        const allAudios = await audioMessagesService.getAvailableAudioMessages(
          roomId,
          user.id,
        );

        // Group by sender (which is the player who spoke about a card)
        cardInfos.forEach((info) => {
          const playerAudios = allAudios.filter(
            (audio) => audio.sender_id === info.playerId && audio.is_public,
          );

          // Also include private messages intended for this user
          const privateAudios = allAudios.filter(
            (audio) =>
              audio.sender_id === info.playerId &&
              !audio.is_public &&
              audio.receiver_id === user.id,
          );

          newCardAudios.set(info.playerId, [...playerAudios, ...privateAudios]);
        });

        setCardAudios(newCardAudios);
      } catch (error) {
        console.error("Failed to fetch audio messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAudios();
  }, [roomId, user.id, cardInfos]);

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
          const audioMessages = cardAudios.get(info.playerId) || [];

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
                <Paper p="xs" radius="md" withBorder mt="sm">
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>
                      Audio Messages ({audioMessages.length})
                    </Text>
                    {audioMessages.map((message) => (
                      <AudioPlayer key={message.id} message={message} />
                    ))}
                  </Stack>
                </Paper>
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
