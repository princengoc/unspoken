// src/components/layout/splash-stages/StageTwo.tsx

import React, { useState } from 'react';
import { Stack, Title, Group, Text, Paper, Button, Box, Flex, Center, rem } from "@mantine/core";
import { IconMicrophone, IconUsers, IconHeart, IconCoffee, IconHome, IconPhoneCall, 
  IconMessageCircle, IconPlayerPlay, IconHeartFilled, IconThumbUp } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar } from './SharedComponents';

interface StageTwoProps {
  selectedCardContent: string;
  onContinue: () => void;
}

// Occasions for the game
const Occasions = [
  {
    id: 'cafe',
    type: 'inperson',
    icon: <IconCoffee style={{ color: '#be4bdb' }} stroke={1.5} />,
    title: 'Cafe Meetup',
    cardPrompt: 'If I could live in any movie...',
    reaction: <IconHeartFilled size={14} color="#ff6b6b" />
  },
  {
    id: 'date',
    type: 'inperson',
    icon: <IconHeart style={{ color: '#ff6b6b' }} stroke={1.5} />,
    title: 'Date Night',
    cardPrompt: 'My perfect weekend would be...',
    reaction: <IconThumbUp size={14} color="#228be6" />
  },
  {
    id: 'longdistance',
    type: 'remote',
    icon: <IconPhoneCall style={{ color: '#228be6' }} stroke={1.5} />,
    title: 'Long Distance',
    cardPrompt: 'Ive always wanted to tell you...',
    reaction: "Tell me more..."
  },
  {
    id: 'family',
    type: 'remote',
    icon: <IconHome style={{ color: '#fd7e14' }} stroke={1.5} />,
    title: 'Family Sharing',
    cardPrompt: 'My favorite childhood memory...',
    reaction: "I remember that!"
  }
];

const StageTwo = ({ selectedCardContent, onContinue }: StageTwoProps) => {
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  
  const selectedOccasionData = selectedOccasion 
    ? Occasions.find(occ => occ.id === selectedOccasion) 
    : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage2"
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
              Perfect for all occasions
            </Title>
          </motion.div>

          <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 540 }}>
            <Stack gap="md">
              {/* Occasion selection - more compact */}
              <Text ta="center" fw={600} size="sm">Where would you play?</Text>
              
              <Group justify="center" gap="md">
                {Occasions.map((occasion, index) => (
                  <motion.div
                    key={occasion.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Paper 
                      shadow="sm" 
                      p="xs" 
                      radius="md" 
                      withBorder 
                      onClick={() => setSelectedOccasion(occasion.id)}
                      style={{ 
                        width: 105,
                        cursor: 'pointer',
                        borderColor: selectedOccasion === occasion.id ? 
                          (occasion.type === 'inperson' ? '#228be6' : '#fd7e14') : undefined,
                        borderWidth: selectedOccasion === occasion.id ? 2 : 1,
                        backgroundColor: selectedOccasion === occasion.id ? 
                          (occasion.type === 'inperson' ? 'rgba(34, 139, 230, 0.05)' : 'rgba(253, 126, 20, 0.05)') : undefined
                      }}
                    >
                      <Stack align="center" gap={6}>
                        <Center 
                          style={{ 
                            width: rem(36), 
                            height: rem(36),
                            borderRadius: rem(18),
                            backgroundColor: 'white'
                          }}
                        >
                          {occasion.icon}
                        </Center>
                        <Text fw={500} ta="center" size="xs">
                          {occasion.title}
                        </Text>
                        <Flex align="center" gap={4}>
                          {occasion.type === 'inperson' ? (
                            <IconUsers size={12} color="#228be6" />
                          ) : (
                            <IconMicrophone size={12} color="#fd7e14" />
                          )}
                          <Text size="xs" c="dimmed" fw={500}>
                            {occasion.type === 'inperson' ? 'In person' : 'Voice'}
                          </Text>
                        </Flex>
                      </Stack>
                    </Paper>
                  </motion.div>
                ))}
              </Group>

              {/* Animation visualization - more compact */}
              <AnimatePresence mode="wait">
                {selectedOccasionData ? (
                  <motion.div
                    key={selectedOccasion}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper 
                      p="sm" 
                      radius="md" 
                      bg={selectedOccasionData.type === 'inperson' ? 
                        "rgba(34, 139, 230, 0.05)" : 
                        "rgba(253, 126, 20, 0.05)"
                      }
                      style={{ height: 120 }}
                    >
                      {selectedOccasionData.type === 'inperson' ? (
                        <Flex direction="column" align="center" gap="sm">
                          <Flex align="center" justify="center" gap="xl">
                            <Stack align="center" style={{ width: 60 }}>
                              <PlayerAvatar color="#228be6" delay={0} size={32} />
                              <Text size="xs" fw={500}>You</Text>
                            </Stack>
                            
                            <Stack align="center" style={{ width: 60 }}>
                              <PlayerAvatar color="#fd7e14" delay={0} size={32} />
                              <Text size="xs" fw={500}>Partner</Text>
                            </Stack>
                          </Flex>
                          
                          <Flex align="center" gap="md">
                            {/* Speech bubble */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.2 }}
                              style={{ 
                                maxWidth: 190,
                                backgroundColor: '#e7f5ff', 
                                borderRadius: 12,
                                padding: '6px 10px',
                                position: 'relative'
                              }}
                            >
                              <Flex align="center" gap="xs">
                                <IconMessageCircle size={14} color="#228be6" />
                                <Text size="xs">{selectedOccasionData.cardPrompt}</Text>
                              </Flex>
                              <Box 
                                style={{
                                  position: 'absolute',
                                  top: 8,
                                  left: -6,
                                  width: 0,
                                  height: 0,
                                  borderTop: '6px solid transparent',
                                  borderRight: '10px solid #e7f5ff',
                                  borderBottom: '6px solid transparent'
                                }}
                              />
                            </motion.div>
                            
                            {/* Reaction */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1 }}
                              style={{ 
                                backgroundColor: '#fff3bf', 
                                borderRadius: 12,
                                padding: '6px 10px',
                                position: 'relative'
                              }}
                            >
                              {typeof selectedOccasionData.reaction === 'string' ? (
                                <Text size="xs">{selectedOccasionData.reaction}</Text>
                              ) : (
                                selectedOccasionData.reaction
                              )}
                            </motion.div>
                          </Flex>
                        </Flex>
                      ) : (
                        <Box>
                          <AnimatePresence>
                            <motion.div
                              key="recording"
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Flex align="center" gap="lg" mb="sm">
                                <Stack align="center" style={{ width: 50 }}>
                                  <PlayerAvatar color="#228be6" delay={0} size={32} />
                                  <Text size="xs" fw={500}>You</Text>
                                </Stack>
                                
                                {/* Recording visualization */}
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.2 }}
                                  style={{ 
                                    backgroundColor: '#e7f5ff', 
                                    borderRadius: 12,
                                    padding: '6px 10px',
                                    position: 'relative',
                                    maxWidth: 200
                                  }}
                                >
                                  <Flex align="center" gap="xs">
                                    <Box style={{ position: 'relative' }}>
                                      <IconMicrophone size={14} color="#228be6" />
                                      <motion.div
                                        animate={{ 
                                          scale: [1, 1.2, 1],
                                          opacity: [0.7, 1, 0.7]
                                        }}
                                        transition={{ 
                                          repeat: Infinity,
                                          duration: 1.5
                                        }}
                                        style={{
                                          position: 'absolute',
                                          top: -4,
                                          left: -4,
                                          right: -4,
                                          bottom: -4,
                                          borderRadius: '50%',
                                          border: '2px solid #228be6',
                                          opacity: 0.7
                                        }}
                                      />
                                    </Box>
                                    <Text size="xs">Recording: {selectedOccasionData.cardPrompt}</Text>
                                  </Flex>
                                </motion.div>
                              </Flex>
                            </motion.div>

                            <motion.div
                              key="listening"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.5, duration: 0.4 }}
                            >
                              <Flex align="center" gap="lg">
                                <Stack align="center" style={{ width: 50 }}>
                                  <PlayerAvatar color="#fd7e14" delay={0} size={32} />
                                  <Text size="xs" fw={500}>Partner</Text>
                                </Stack>
                                
                                {/* Playback visualization */}
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  style={{ 
                                    backgroundColor: '#fff3bf', 
                                    borderRadius: 12,
                                    padding: '6px 10px',
                                    position: 'relative',
                                    maxWidth: 200
                                  }}
                                >
                                  <Flex align="center" gap="xs">
                                    <IconPlayerPlay size={14} color="#fd7e14" />
                                    <Text size="xs">
                                      {typeof selectedOccasionData.reaction === 'string' ? 
                                        selectedOccasionData.reaction : 
                                        "Listening..."}
                                    </Text>
                                  </Flex>
                                </motion.div>
                              </Flex>
                            </motion.div>
                          </AnimatePresence>
                        </Box>
                      )}
                    </Paper>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Paper p="sm" radius="md" bg="rgba(241, 243, 245, 0.3)" style={{ height: 120 }}>
                      <Flex align="center" justify="center" style={{ height: '100%' }}>
                        <Text size="sm" fw={500} c="dimmed">
                          Select an occasion to see how it works
                        </Text>
                      </Flex>
                    </Paper>
                  </motion.div>
                )}
              </AnimatePresence>
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
              disabled={!selectedOccasion}
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