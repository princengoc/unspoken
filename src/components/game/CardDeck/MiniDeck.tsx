// Mini version of CardDeck, only shows a list of cards and allows selection straight away
// Does not do animation. Suitable for browsing
import { useState } from "react";
import { Group } from "@mantine/core";
import type { Card as CardType } from "@/core/game/types";
import { MiniCard } from "./MiniCard";

interface MiniDeckProps {
  cards: CardType[];
  onSelect?: (cardId: string) => void;
}

export function MiniDeck({ cards, onSelect }: MiniDeckProps) {
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
            isSelected={selectedCardIndex === index}
            onClick={() => handlePeripheralCardClick(index)}
          />
        ))}
      </Group>
    </div>
  );
}
