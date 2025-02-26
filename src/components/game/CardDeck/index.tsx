import { useState } from "react";
import { Group, Stack, Text, Button } from "@mantine/core";
import { motion } from "framer-motion";
import type { Card as CardType } from "@/core/game/types";
import { Card } from "../Card";

interface CardDeckProps {
  cards: CardType[];
  onSelect?: (cardId: string) => void;
}

export function CardDeck({ cards, onSelect }: CardDeckProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Animations for card selection
  const cardVariants = {
    unselected: { scale: 1, y: 0 },
    selected: { scale: 1.05, y: -10, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" },
  };

  // Handle card selection
  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
  };

  // Handle confirming selection
  const handleConfirmSelection = () => {
    if (selectedCardId && onSelect) {
      onSelect(selectedCardId);
    }
  };

  return (
    <Stack gap="md" align="center">
      <Text size="lg" fw={500} ta="center">
        Choose the card that resonates with you the most
      </Text>

      <Group align="flex-start" justify="center" gap="md">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            variants={cardVariants}
            animate={selectedCardId === card.id ? "selected" : "unselected"}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            style={{ cursor: "pointer" }}
            onClick={() => handleSelectCard(card.id)}
          >
            <Card
              card={card}
              selected={selectedCardId === card.id}
              onSelect={() => handleSelectCard(card.id)}
            />
          </motion.div>
        ))}
      </Group>

      <Button
        size="lg"
        disabled={!selectedCardId}
        onClick={handleConfirmSelection}
        mt="md"
      >
        Confirm Selection
      </Button>
    </Stack>
  );
}
