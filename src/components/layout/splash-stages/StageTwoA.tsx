// src/components/layout/splash-stages/StageTwoA.tsx

import React from 'react';
import { Stack, Title, Group, Text, Paper, Button, Box, Flex, Center, rem } from "@mantine/core";
import { IconCoffee, IconHeart, IconCar, IconDots } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar } from './SharedComponents';

interface StageTwoAProps {
  selectedCardContent: string;
  onContinue: () => void;
}

// In-person occasions
const InPersonOccasions = [
  {
    id: 'cafe',
    icon: <IconCoffee style={{ color: '#be4bdb' }} stroke={1.5} />,
    title: 'Cafe Meetup',
  },
  {
    id: 'date',
    icon: <IconHeart style={{ color: '#ff6b6b' }} stroke={1.5} />,
    title: 'Date Night',
  },
  {
    id: 'roadtrip',
    icon: <IconCar style={{ color: '#5c7cfa' }} stroke={1.5} />,
    title: 'Road Trip',
  },
  {
    id: 'more',
    icon: <IconDots style={{ color: '#495057' }} stroke={1.5} />,
    title: 'and more...'
  }
];

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
            <Stack gap="xl">
              {/* Occasion icons */}
              <Group justify="center" gap="xl">
                {InPersonOccasions.map((occasion) => (
                  <Box key={occasion.id} style={{ cursor: 'default' }}>
                    <Flex 
                      direction="column" 
                      align="center" 
                      gap={4}
                    >
                      <Center 
                        style={{ 
                          width: rem(50), 
                          height: rem(50),
                          borderRadius: rem(25),
                          backgroundColor: 'rgba(241, 243, 245, 0.5)',
                          border: '2px solid transparent',
                        }}
                      >
                        <Box style={{ transform: 'scale(1.3)' }}>
                          {occasion.icon}
                        </Box>
                      </Center>
                      {occasion.title && 
                        <Text fw={600} ta="center" size="sm" mt={4}>
                            {occasion.title }
                        </Text>
                        }
                    </Flex>
                  </Box>
                ))}
              </Group>

              {/* Conversation visualization */}
              <Box 
                style={{ 
                  minHeight: 200, 
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  paddingTop: 16
                }}
              >
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      style={{ 
                        backgroundColor: '#e7f5ff', 
                        borderRadius: 12,
                        padding: '12px 16px',
                        alignSelf: 'flex-start',
                        maxWidth: '85%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Text size="sm" fw={500}>{selectedCardContent}</Text>
                    </motion.div>
                    
                    {/* Friend 1's message bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5, duration: 0.5 }}
                      style={{ 
                        backgroundColor: '#fff3bf', 
                        borderRadius: 12,
                        padding: '12px 16px',
                        alignSelf: 'flex-end',
                        maxWidth: '85%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Text size="sm" fw={500}>Tell us more!</Text>
                    </motion.div>

                    {/* Friend 2's message bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 2.2, duration: 0.5 }}
                      style={{ 
                        backgroundColor: '#e6fcf5', 
                        borderRadius: 12,
                        padding: '12px 16px',
                        alignSelf: 'flex-end',
                        maxWidth: '85%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Text size="sm" fw={500}>That reminds of me when I ...</Text>
                    </motion.div>
                  </Flex>
                  
                  {/* Right: Friends */}
                  <Flex direction="column" style={{ width: 60 }}>
                    {/* Friend 1 */}
                    <Stack align="center" style={{ marginBottom: 20 }}>
                      <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                      <Text size="xs" fw={600}>Friend 1</Text>
                    </Stack>
                    
                    {/* Friend 2 */}
                    <Stack align="center" style={{ marginLeft: 10 }}>
                      <PlayerAvatar color="#12b886" delay={0} size={40} />
                      <Text size="xs" fw={600}>Friend 2</Text>
                    </Stack>
                  </Flex>
                </Flex>
              </Box>
            </Stack>
          </Paper>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.5 }}
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