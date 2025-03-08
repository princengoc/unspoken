// src/components/layout/splash-stages/StageFive.tsx

import React from 'react';
import { Stack, Text, Paper, Button } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { UnspokenGameTitle } from "@/core/game/unspokenIcon";

interface StageFiveProps {
  isLoggedIn: boolean;
  onComplete: () => void;
}

const StageFive = ({ isLoggedIn, onComplete }: StageFiveProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.5 }}
      >
        <Stack align="center" gap="xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Paper
              shadow="md"
              p="xl"
              radius="lg"
              withBorder
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                maxWidth: 500
              }}
            >
              <Stack align="center" gap="md">
                <UnspokenGameTitle size={2} />
                <Text size="xl" fw={300} c="white" ta="center">
                  A game of cards, a journey of words.
                </Text>
              </Stack>
            </Paper>
          </motion.div>
          
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {isLoggedIn ? (
              <Button
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: '#6B73FF', to: '#000DFF' }}
                rightSection={<IconChevronDown size={20} />}
                onClick={onComplete}
              >
                Enter Lobby
              </Button>
            ) : (
              <Button
                size="lg"
                radius="xl"
                variant="gradient"
                gradient={{ from: '#6B73FF', to: '#000DFF' }}
                onClick={onComplete}
              >
                Start Playing
              </Button>
            )}
          </motion.div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default StageFive;