// src/components/layout/splash-stages/StageThree.tsx

import React from 'react';
import { Stack, Title, Group, Text, Paper, Button } from "@mantine/core";
import { IconExchange } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar } from './SharedComponents';

interface StageThreeProps {
  exchangeCards: string[];
  onContinue: () => void;
}

const StageThree = ({ exchangeCards, onContinue }: StageThreeProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Stack align="center" gap="xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Title order={3} ta="center" mb="lg" c="white">
              Ask & exchange questions with others
            </Title>
          </motion.div>
          
          <Group align="center" style={{ width: '100%', maxWidth: 600 }}>
            <Stack align="center" gap="md">
              <PlayerAvatar color="#228be6" delay={0.5} />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Paper shadow="sm" p="xs" radius="md" withBorder style={{ width: 150, height: 120 }}>
                  <Text size="sm" ta="center">
                    {exchangeCards[0]}
                  </Text>
                </Paper>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
              >
                <Text size="xs" c="white">Asks Player B</Text>
              </motion.div>
            </Stack>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.4, type: 'spring' }}
            >
              <IconExchange size={40} color="white" />
            </motion.div>
            
            <Stack align="center" gap="md">
              <PlayerAvatar color="#ff6b6b" delay={0.7} />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Paper shadow="sm" p="xs" radius="md" withBorder style={{ width: 150, height: 120 }}>
                  <Text size="sm" ta="center">
                    {exchangeCards[1]}
                  </Text>
                </Paper>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3 }}
              >
                <Text size="xs" c="white">Asks Player A</Text>
              </motion.div>
            </Stack>
          </Group>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <Text c="white" ta="center" mt="sm" size="sm">
              Exchange questions that matter to you
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5 }}
          >
            <Button
              variant="light"
              size="md"
              radius="xl"
              onClick={onContinue}
            >
              Continue
            </Button>
          </motion.div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default StageThree;