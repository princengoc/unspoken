// Mini version of CardDeck, only shows a list of cards and allows selection straight away
// Does not do animation. Suitable for browsing
import { useState } from "react";
import { Group } from "@mantine/core";
import type { Card as CardType } from "@/core/game/types";
import { MiniCard, MoodType } from "./MiniCard";

interface MiniDeckProps {
  cards: CardType[];
  assignedMoods?: Record<number, MoodType>;
  onSelect?: (cardId: string) => void;
}

export function MiniDeck({
  cards,
  assignedMoods = {},
  onSelect,
}: MiniDeckProps) {
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(
    null,
  );

  const handlePeripheralCardClick = (index: number) => {
    setSelectedCardIndex(index);
    onSelect?.(cards[index].id);
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Group gap="xs" justify="center">
        {cards.map((card, index) => (
          <MiniCard
            key={index}
            card={card}
            mood={assignedMoods[index]} // Will be undefined if not assigned
            isSelected={selectedCardIndex === index}
            onClick={() => handlePeripheralCardClick(index)}
          />
        ))}
      </Group>
    </div>
  );
}
