// src/components/layout/splash-stages/StageTwo.tsx

import React from 'react';
import { Stack, Title, Group, Text, Paper, Badge, Button } from "@mantine/core";
import { IconMicrophone } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar, AudioWave } from './SharedComponents';

interface StageTwoProps {
  selectedCardContent: string;
  onContinue: () => void;
}

const StageTwo = ({ selectedCardContent, onContinue }: StageTwoProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage2"
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
              Share your story, in person or remotely
            </Title>
          </motion.div>

          <Group align="center" gap="xl">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Paper shadow="md" p="md" radius="md" withBorder style={{ width: 220 }}>
                <Stack align="center" gap="md">
                  <Text fw={500} ta="center">
                    {selectedCardContent}
                  </Text>
                  
                  <Group gap="md">
                    <PlayerAvatar color="#228be6" delay={1.2} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.4 }}
                    >
                      <IconMicrophone size={24} />
                    </motion.div>
                  </Group>
                  
                  <AudioWave delay={1.6} />
                </Stack>
              </Paper>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <Group gap="md">
                <Badge color="blue" size="lg">In Person</Badge>
                <Text fw={600} c="white">OR</Text>
                <Badge color="orange" size="lg">Voice Message</Badge>
              </Group>
            </motion.div>
          </Group>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            <Text c="white" ta="center" mt="sm" size="sm">
              No pressure - share in your own way, at your own pace
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
            >
              Continue
            </Button>
          </motion.div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default StageTwo;