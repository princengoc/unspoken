// src/components/layout/splash-stages/StageOne.tsx

import React from "react";
import { Stack, Title, Group, Text, Button } from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCard } from "./SharedComponents";

interface StageOneProps {
  cards: string[];
  selectedCard: number | null;
  onCardSelect: (index: number) => void;
  onContinue: () => void;
}

const StageOne = ({
  cards,
  selectedCard,
  onCardSelect,
  onContinue,
}: StageOneProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Stack align="center" gap="xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Title order={3} ta="center" mb="lg" c="white">
              Draw cards, select one that sparks a story
            </Title>
          </motion.div>

          <Group justify="center" gap="lg">
            {cards.map((content, index) => (
              <AnimatedCard
                key={index}
                content={content}
                delay={index * 0.3 + 0.8}
                isSelected={selectedCard === index}
                onSelect={() => onCardSelect(index)}
              />
            ))}
          </Group>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <Text size="sm" fw={500} c="white" mt="md">
              Tap a card to select it
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3 }}
          >
            <Button
              variant="light"
              size="md"
              radius="xl"
              onClick={onContinue}
              disabled={selectedCard === null}
              style={{ opacity: selectedCard === null ? 0.5 : 1 }}
            >
              Continue
            </Button>
          </motion.div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default StageOne;
