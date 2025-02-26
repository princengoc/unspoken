// src/components/game/PlayerCardGrid.tsx
import React from "react";
import { Group, Text, Box } from "@mantine/core";
import { SlideIn } from "@/components/animations/Motion";
import { MiniCard} from "./CardDeck/MiniCard";
import { PlayerAssignment } from "./statusBarUtils";
import { Card as CardType } from "@/core/game/types";

export interface PlayerCardInfo {
  playerId: string;
  playerName: string;
  playerAssignment?: PlayerAssignment;
  card: CardType;
  contributorId?: string;
  contributorName?: string | null;
  contributorAssignment?: PlayerAssignment;
}

interface PlayerCardGridProps {
  cardInfos: PlayerCardInfo[];
  showSender?: boolean;
  animate?: boolean;
  highlightPlayerId?: string | null;
  title?: string | null;
  onCardClick?: (playerId: string, cardId: string) => void;
  actionButtons?: (playerId: string) => React.ReactNode;
}

export function PlayerCardGrid({ 
  cardInfos, 
  showSender = false, 
  animate = true,
  highlightPlayerId = null,
  title = null,
  onCardClick,
  actionButtons
}: PlayerCardGridProps) {
  return (
    <>
      {title && <Text fw={500} mb="xs">{title}</Text>}
      <Group align="center" justify="center" gap="xl">
        {cardInfos.map((info, index) => {
          // Filter out undefined/null cards
          if (!info.card) return null;
          
          // Check if this card should be highlighted
          const isHighlighted = highlightPlayerId ? info.playerId === highlightPlayerId : false;
          
          // Prepare the card component with appropriate props
          const card = (
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
                onClick={onCardClick ? () => onCardClick(info.playerId, info.card.id) : undefined}
              />
              
              {/* Render action buttons if provided */}
              {actionButtons && (
                <Box mt="xs">
                  {actionButtons(info.playerId)}
                </Box>
              )}
            </Box>
          );
          
          // Apply animation if needed
          return animate ? (
            <SlideIn key={info.playerId + index} delay={index * 0.1}>
              {card}
            </SlideIn>
          ) : (
            <div key={info.playerId + index}>{card}</div>
          );
        })}
      </Group>
    </>
  );
}