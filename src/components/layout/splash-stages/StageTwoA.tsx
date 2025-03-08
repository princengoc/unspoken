// src/components/layout/splash-stages/StageTwoA.tsx

import React from 'react';
import { Stack, Title, Text, Paper, Button, Box, Flex } from "@mantine/core";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar } from './SharedComponents';

interface StageTwoAProps {
  selectedCardContent: string;
  onContinue: () => void;
}

// Message bubble component for cleaner code
interface MessageBubbleProps {
  content: string;
  backgroundColor: string;
  alignSelf: 'flex-start' | 'flex-end';
  delay: number;
}

const MessageBubble = ({ content, backgroundColor, alignSelf, delay }: MessageBubbleProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    style={{ 
      backgroundColor, 
      borderRadius: 12,
      padding: '12px 16px',
      alignSelf,
      maxWidth: '85%',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    }}
  >
    <Text size="sm" fw={500}>{content}</Text>
  </motion.div>
);

const StageTwoA = ({ selectedCardContent, onContinue }: StageTwoAProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage2a"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Stack align="center" gap="md">
          <Title order={3} ta="center" mb="xs" c="white">
            Take turns sharing your stories
          </Title>

          <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 520 }}>
            <Box style={{ minHeight: 200 }}>
              <Flex align="flex-start">
                {/* Left: You */}
                <Stack align="center" style={{ width: 60 }}>
                  <PlayerAvatar color="#228be6" delay={0} size={40} />
                  <Text size="xs" fw={600}>You</Text>
                </Stack>
                
                {/* Middle: Conversation */}
                <Flex 
                  direction="column"
                  align="stretch"
                  gap="md"
                  style={{ flex: 1, marginLeft: 8, marginRight: 8 }}
                >
                  {/* Your message bubble */}
                  <MessageBubble 
                    content={selectedCardContent}
                    backgroundColor="#e7f5ff"
                    alignSelf="flex-start"
                    delay={0.5}
                  />
                  
                  {/* Friend 1's message bubble */}
                  <MessageBubble 
                    content="Tell us more!"
                    backgroundColor="#fff3bf"
                    alignSelf="flex-end"
                    delay={1.5}
                  />

                  {/* Friend 2's message bubble */}
                  <MessageBubble 
                    content="That reminds me of when I..."
                    backgroundColor="#e6fcf5"
                    alignSelf="flex-end"
                    delay={2.5}
                  />
                </Flex>
                
                {/* Right: Friends */}
                <Stack align="center" style={{ width: 60 }}>
                  <Box>
                    <Stack align="center" style={{ marginBottom: 20 }}>
                      <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                      <Text size="xs" fw={600}>Friend 1</Text>
                    </Stack>
                    
                    <Stack align="center">
                      <PlayerAvatar color="#12b886" delay={0} size={40} />
                      <Text size="xs" fw={600}>Friend 2</Text>
                    </Stack>
                  </Box>
                </Stack>
              </Flex>
            </Box>
          </Paper>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 0.5 }}
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

export default StageTwoA;