// src/components/layout/splash-stages/StageFour.tsx

import React from 'react';
import { Stack, Title, Group, Text, Paper, Badge, Button } from "@mantine/core";
import { IconMessages, IconMicrophone, IconHeart } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';

interface StageFourProps {
  onContinue: () => void;
}

const StageFour = ({ onContinue }: StageFourProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage4"
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
              Build connections in a safe space
            </Title>
          </motion.div>
          
          <Group gap="xl" align="center" justify="center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Paper 
                shadow="sm" 
                radius="md" 
                p="md"
                style={{ textAlign: 'center', width: 120 }}
              >
                <IconMessages size={36} color="#228be6" />
                <Text size="sm" mt="xs">Draw Cards</Text>
              </Paper>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Text fw={700} size="lg" c="white">→</Text>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Paper 
                shadow="sm" 
                radius="md" 
                p="md"
                style={{ textAlign: 'center', width: 120 }}
              >
                <IconMicrophone size={36} color="#228be6" />
                <Text size="sm" mt="xs">Share Stories</Text>
              </Paper>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <Text fw={700} size="lg" c="white">→</Text>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
            >
              <Paper 
                shadow="sm" 
                radius="md" 
                p="md"
                style={{ textAlign: 'center', width: 120 }}
              >
                <IconHeart size={36} color="#228be6" />
                <Text size="sm" mt="xs">Connect</Text>
              </Paper>
            </motion.div>
          </Group>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            <Group gap="xs" mt="md">
              <Badge color="green" size="lg">Safe Space</Badge>
              <Badge color="blue" size="lg">Low Pressure</Badge>
              <Badge color="orange" size="lg">Remote or In-Person</Badge>
            </Group>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3 }}
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

export default StageFour;