// src/components/game/PlayerCardGrid.tsx
import React from "react";
import { SimpleGrid } from "@mantine/core";
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
}

export function PlayerCardGrid({ 
  cardInfos, 
  showSender = false, 
  animate = true 
}: PlayerCardGridProps) {
  return (
    <SimpleGrid
      cols={{ base: 2, sm: 3, md: 4 }}
      spacing="xs"
      verticalSpacing="xs"
    >
      {cardInfos.map((info, index) => {
        // Filter out undefined/null cards
        if (!info.card) return null;
        
        // Prepare the card component with appropriate props
        const card = (
          <MiniCard
            key={info.playerId}
            card={info.card}
            showSender={showSender}
            playerAssignment={info.playerAssignment}
            playerName={info.playerName}
            contributorAssignment={info.contributorAssignment}
            contributorName={info.contributorName}
          />
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
    </SimpleGrid>
  );
}