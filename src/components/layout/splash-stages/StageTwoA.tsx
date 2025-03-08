// src/components/layout/splash-stages/StageTwoA.tsx

import React from 'react';
import { Stack, Title, Group, Text, Paper, Button, Box, Flex, Center, rem } from "@mantine/core";
import { IconCoffee, IconHeart, IconCar, IconMessageCircle } from "@tabler/icons-react";
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
];

const StageTwoA = ({ selectedCardContent, onContinue }: StageTwoAProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage2a"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Stack align="center" gap="md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Title order={3} ta="center" mb="xs" c="white">
              Take turns sharing your stories
            </Title>
          </motion.div>

          <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 540 }}>
            <Stack gap="xl">              
              <Group justify="center" gap="xl">
                {InPersonOccasions.map((occasion, index) => (
                  <motion.div
                    key={occasion.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                  >
                    <Box style={{ cursor: 'default' }}>
                      <Flex 
                        direction="column" 
                        align="center" 
                        gap={4}
                      >
                        <Center 
                          style={{ 
                            width: rem(56), 
                            height: rem(56),
                            borderRadius: rem(28),
                            backgroundColor: 'rgba(241, 243, 245, 0.5)',
                            transition: 'all 0.2s ease-in-out',
                            border: '2px solid transparent',
                          }}
                        >
                          <Box style={{ transform: 'scale(1.4)' }}>
                            {occasion.icon}
                          </Box>
                        </Center>
                        <Text fw={600} ta="center" size="sm" mt={4}>
                          {occasion.title}
                        </Text>
                      </Flex>
                    </Box>
                  </motion.div>
                ))}
              </Group>

              {/* Group conversation visualization */}
              <Box 
                style={{ 
                  height: 180, 
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  paddingTop: 16
                }}
              >
                <Flex align="flex-start" h="100%" style={{ position: 'relative' }}>
                  {/* Player A - first person */}
                  <Stack align="center" style={{ width: 60 }}>
                    <PlayerAvatar color="#228be6" delay={0} size={40} />
                    <Text size="xs" fw={600}>You</Text>
                  </Stack>
                  
                  {/* Speech flow */}
                  <Flex 
                    align="center" 
                    justify="center" 
                    direction="column"
                    gap="md"
                    style={{ flex: 1, position: 'relative' }}
                  >
                    <motion.div
                      initial={{ width: '0%', opacity: 0 }}
                      animate={{ width: '100%', opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      style={{
                        height: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        position: 'absolute',
                        top: 20,
                        left: 0,
                        right: 0,
                        zIndex: 0
                      }}
                    />
                  
                    {/* Speech bubble from You */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      style={{ 
                        backgroundColor: '#e7f5ff', 
                        borderRadius: 12,
                        padding: '8px 14px',
                        maxWidth: '80%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        zIndex: 1
                      }}
                    >
                      <Flex align="center" gap="xs">
                        <IconMessageCircle size={16} color="#228be6" />
                        <Text size="sm" fw={500}>{selectedCardContent}</Text>
                      </Flex>
                    </motion.div>
                    
                    {/* Response bubble from Friend 1 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                      style={{ 
                        backgroundColor: '#fff3bf', 
                        borderRadius: 12,
                        padding: '8px 14px',
                        maxWidth: '80%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Text size="sm" fw={500}>That's amazing! I remember when...</Text>
                    </motion.div>

                    {/* Response bubble from Friend 2 */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 }}
                      style={{ 
                        backgroundColor: '#e6fcf5', 
                        borderRadius: 12,
                        padding: '8px 14px',
                        maxWidth: '80%',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      <Text size="sm" fw={500}>I had a similar experience!</Text>
                    </motion.div>
                  </Flex>
                  
                  {/* Two friends on the right with slight vertical offset */}
                  <Flex direction="column" style={{ width: 120 }}>
                    {/* Friend 1 */}
                    <Stack align="center" style={{ width: 60, marginBottom: 30 }}>
                      <PlayerAvatar color="#fd7e14" delay={0.2} size={40} />
                      <Text size="xs" fw={600}>Friend 1</Text>
                    </Stack>
                    
                    {/* Friend 2 */}
                    <Stack align="center" style={{ width: 60, marginLeft: 30 }}>
                      <PlayerAvatar color="#12b886" delay={0.3} size={40} />
                      <Text size="xs" fw={600}>Friend 2</Text>
                    </Stack>
                  </Flex>
                </Flex>
              </Box>
            </Stack>
          </Paper>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
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