// src/components/layout/splash-stages/StageTwo.tsx

import React, { useState } from 'react';
import { Stack, Title, Group, Text, Paper, Button, Box, Flex, Center, rem } from "@mantine/core";
import { IconMicrophone, IconHeart, IconCoffee, IconHome, IconPhoneCall, 
  IconMessageCircle, IconPlayerPlay, IconHeartFilled, IconSend, IconCheck, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar, AudioWave } from './SharedComponents';

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
    cardPrompt: 'My favorite childhood memory...',
  },
  {
    id: 'date',
    type: 'inperson',
    icon: <IconHeart style={{ color: '#ff6b6b' }} stroke={1.5} />,
    title: 'Date Night',
    cardPrompt: 'My favorite childhood memory...',
  },
  {
    id: 'longdistance',
    type: 'remote',
    icon: <IconPhoneCall style={{ color: '#228be6' }} stroke={1.5} />,
    title: 'Long Distance',
    cardPrompt: 'My favorite childhood memory...',
  },
  {
    id: 'family',
    type: 'remote',
    icon: <IconHome style={{ color: '#fd7e14' }} stroke={1.5} />,
    title: 'Family Sharing',
    cardPrompt: 'My favorite childhood memory...',
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
              Share and deepen your connections anywhere
            </Title>
          </motion.div>

          <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 540 }}>
            <Stack gap="xl">              
              <Group justify="center" gap="xl">
                {Occasions.map((occasion, index) => (
                  <motion.div
                    key={occasion.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box 
                      onClick={() => setSelectedOccasion(occasion.id)}
                      style={{ 
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
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
                            backgroundColor: selectedOccasion === occasion.id 
                              ? (occasion.type === 'inperson' ? 'rgba(34, 139, 230, 0.15)' : 'rgba(253, 126, 20, 0.15)') 
                              : 'rgba(241, 243, 245, 0.5)',
                            boxShadow: selectedOccasion === occasion.id 
                              ? '0 0 12px 2px rgba(0, 0, 0, 0.08)' 
                              : 'none',
                            transition: 'all 0.2s ease-in-out',
                            border: selectedOccasion === occasion.id 
                              ? `2px solid ${occasion.type === 'inperson' ? '#228be6' : '#fd7e14'}` 
                              : '2px solid transparent',
                          }}
                        >
                          <Box style={{ transform: 'scale(1.4)' }}>
                            {occasion.icon}
                          </Box>
                        </Center>
                        <Text fw={600} ta="center" size="sm" mt={4}>
                          {occasion.title}
                        </Text>
                        
                        {selectedOccasion === occasion.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              backgroundColor: occasion.type === 'inperson' ? '#228be6' : '#fd7e14',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <IconArrowRight size={12} stroke={3} color="white" />
                          </motion.div>
                        )}
                      </Flex>
                    </Box>
                  </motion.div>
                ))}
              </Group>

              {/* Animation visualization */}
              <AnimatePresence mode="wait">
                {selectedOccasionData ? (
                  <motion.div
                    key={selectedOccasion}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box 
                      style={{ 
                        height: 140, 
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                        paddingTop: 16
                      }}
                    >
                      {selectedOccasionData.type === 'inperson' ? (
                        <Flex align="flex-start" gap="xl" h="100%" style={{ position: 'relative' }}>
                          {/* Player A - always on left */}
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
                                <Text size="sm" fw={500}>{selectedOccasionData.cardPrompt}</Text>
                              </Flex>
                            </motion.div>
                            
                            {/* Response bubble from Partner */}
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 1.2 }}
                              style={{ 
                                backgroundColor: '#fff3bf', 
                                borderRadius: 12,
                                padding: '8px 14px',
                                maxWidth: '80%',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              <Text size="sm" fw={500}>That sounds wonderful!</Text>
                            </motion.div>
                          </Flex>
                          
                          {/* Player B - always on right */}
                          <Stack align="center" style={{ width: 60 }}>
                            <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                            <Text size="xs" fw={600}>Partner</Text>
                          </Stack>
                        </Flex>
                      ) : (
                        <Box style={{ height: '100%', position: 'relative' }}>
                          <AnimatePresence mode="wait">
                            {(() => {
                              // This function is just for scoping, not a component
                              return selectedOccasionData && selectedOccasionData.type === 'remote' ? (
                                <>
                                  {/* Recording animation */}
                                  <motion.div
                                    key="recording"
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    style={{ 
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%'
                                    }}
                                  >
                                    <Flex align="flex-start" gap="xl" style={{ height: '100%' }}>
                                      {/* Player A - recording */}
                                      <Stack align="center" style={{ width: 60 }}>
                                        <PlayerAvatar color="#228be6" delay={0} size={40} />
                                        <Text size="xs" fw={600}>You</Text>
                                      </Stack>
                                      
                                      <Flex 
                                        direction="column" 
                                        align="center"
                                        style={{ flex: 1 }}
                                      >
                                        {/* Recording card */}
                                        <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.2 }}
                                          style={{ 
                                            backgroundColor: '#e7f5ff', 
                                            borderRadius: 12,
                                            padding: '12px 16px',
                                            width: '100%',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                                          }}
                                        >
                                          <Flex direction="column" gap="md">
                                            <Flex align="center" justify="space-between">
                                              <Text size="sm" fw={500}>{selectedOccasionData.cardPrompt}</Text>
                                              
                                              <Flex align="center" gap="xs">
                                                <motion.div
                                                  animate={{ 
                                                    scale: [1, 1.15, 1],
                                                  }}
                                                  transition={{ 
                                                    repeat: Infinity,
                                                    duration: 1.5
                                                  }}
                                                  style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    backgroundColor: '#fa5252',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                  }}
                                                >
                                                  <IconMicrophone size={20} color="white" />
                                                </motion.div>
                                                
                                                <Box>
                                                  <Box style={{ display: 'flex', gap: 4, height: 20 }}>
                                                    {[0.5, 0.7, 0.9, 0.7, 0.5].map((height, i) => (
                                                      <motion.div
                                                        key={i}
                                                        animate={{ 
                                                          height: [height * 10, height * 18, height * 10], 
                                                          backgroundColor: ['#adb5bd', '#228be6', '#adb5bd']
                                                        }}
                                                        transition={{ 
                                                          repeat: Infinity, 
                                                          duration: 1, 
                                                          delay: i * 0.1,
                                                          repeatType: 'mirror'
                                                        }}
                                                        style={{
                                                          width: 3,
                                                          borderRadius: 1,
                                                          backgroundColor: '#adb5bd',
                                                        }}
                                                      />
                                                    ))}
                                                  </Box>
                                                  <Text size="xs" fw={500} c="dimmed">Recording...</Text>
                                                </Box>
                                              </Flex>
                                            </Flex>
                                            
                                            {/* Recording progress bar */}
                                            <Box>
                                              <Flex align="center" gap="xs" mb={4}>
                                                <Text size="xs" c="dimmed">0:00</Text>
                                                <Box style={{ flex: 1 }}></Box>
                                                <Text size="xs" c="dimmed">0:30</Text>
                                              </Flex>
                                              
                                              <Box style={{ 
                                                height: 6, 
                                                backgroundColor: '#e9ecef', 
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                                position: 'relative'
                                              }}>
                                                <motion.div
                                                  initial={{ width: '0%' }}
                                                  animate={{ width: '100%' }}
                                                  transition={{ 
                                                    duration: 3,
                                                    ease: 'linear'
                                                  }}
                                                  style={{
                                                    height: '100%',
                                                    backgroundColor: '#228be6',
                                                    borderRadius: 3
                                                  }}
                                                />
                                              </Box>
                                            </Box>
                                          </Flex>
                                        </motion.div>
                                        
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 3 }}
                                          style={{
                                            marginTop: 16,
                                            backgroundColor: '#e9ecef',
                                            borderRadius: 100,
                                            padding: '6px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                          }}
                                        >
                                          <Box 
                                            style={{
                                              width: 18,
                                              height: 18,
                                              borderRadius: '50%',
                                              backgroundColor: '#40c057',
                                              display: 'flex',
                                              justifyContent: 'center',
                                              alignItems: 'center'
                                            }}
                                          >
                                            <IconCheck size={12} color="white" />
                                          </Box>
                                          <Text size="xs" fw={500} c="dimmed">
                                            Recording sent
                                          </Text>
                                        </motion.div>
                                      </Flex>
                                      
                                      {/* Empty space where partner will be */}
                                      <Box style={{ width: 60 }} />
                                    </Flex>
                                  </motion.div>
                                  
                                  {/* Playback animation - appears after delay and completely replaces recording */}
                                  <motion.div
                                    key="playback"
                                    initial={{ opacity: 0 }}
                                    animate={{ 
                                      opacity: 1,
                                      transition: { delay: 3.5, duration: 0.4 } 
                                    }}
                                    style={{ 
                                      position: 'absolute',
                                      width: '100%',
                                      height: '100%'
                                    }}
                                  >
                                    <Flex align="flex-start" gap="xl" style={{ height: '100%' }}>
                                      {/* No player A in this stage */}
                                      <Box style={{ width: 60 }} />
                                      
                                      <Flex 
                                        direction="column"
                                        align="center"
                                        justify="center"
                                        style={{ flex: 1 }}
                                      >
                                        <motion.div
                                          initial={{ opacity: 0, y: 10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.2 }}
                                          style={{ 
                                            backgroundColor: '#fff3bf', 
                                            borderRadius: 12,
                                            padding: '12px 16px',
                                            width: '100%',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                                          }}
                                        >
                                          <Flex direction="column" gap="sm">
                                            <Flex align="center" justify="space-between">
                                              <Flex direction="column" gap={4}>
                                                <Text size="xs" fw={500} c="dimmed">
                                                  Voice message from You
                                                </Text>
                                                <Text size="sm" fw={500}>
                                                  {selectedOccasionData.cardPrompt}
                                                </Text>
                                              </Flex>
                                              
                                              <motion.div
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                style={{
                                                  width: 36,
                                                  height: 36,
                                                  borderRadius: '50%',
                                                  backgroundColor: '#fd7e14',
                                                  display: 'flex',
                                                  justifyContent: 'center',
                                                  alignItems: 'center'
                                                }}
                                              >
                                                <IconPlayerPlay size={18} color="white" />
                                              </motion.div>
                                            </Flex>
                                            
                                            {/* Playback progress bar */}
                                            <Box>
                                              <Box style={{ 
                                                height: 28,
                                                position: 'relative',
                                                marginBottom: 6
                                              }}>
                                                <motion.div
                                                  animate={{
                                                    opacity: [0, 1, 1, 0],
                                                    x: ['-50%', '-50%', '-50%', '-50%'],
                                                    left: ['0%', '25%', '75%', '100%']
                                                  }}
                                                  transition={{
                                                    duration: 3,
                                                    repeat: 0,
                                                    ease: 'linear',
                                                    delay: 0.5,
                                                    times: [0, 0.2, 0.8, 1]
                                                  }}
                                                  style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    width: 'auto'
                                                  }}
                                                >
                                                  <AudioWave delay={0} />
                                                </motion.div>
                                              </Box>
                                              
                                              <Box style={{ 
                                                height: 4, 
                                                backgroundColor: '#e9ecef', 
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                position: 'relative'
                                              }}>
                                                <motion.div
                                                  initial={{ width: '0%' }}
                                                  animate={{ width: '100%' }}
                                                  transition={{ 
                                                    duration: 3,
                                                    ease: 'linear',
                                                    delay: 0.5
                                                  }}
                                                  style={{
                                                    height: '100%',
                                                    backgroundColor: '#fd7e14',
                                                    borderRadius: 2
                                                  }}
                                                />
                                              </Box>
                                              
                                              <Flex align="center" justify="space-between" mt={4}>
                                                <Text size="xs" c="dimmed">0:00</Text>
                                                <Text size="xs" c="dimmed">0:30</Text>
                                              </Flex>
                                            </Box>
                                          </Flex>
                                        </motion.div>
                                      </Flex>
                                      
                                      {/* Player B - receiving */}
                                      <Stack align="center" style={{ width: 60 }}>
                                        <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                                        <Text size="xs" fw={600}>Partner</Text>
                                      </Stack>
                                    </Flex>
                                  </motion.div>
                                </>
                              ) : null;
                            })()}
                          </AnimatePresence>
                        </Box>
                      )}
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Box 
                      style={{ 
                        height: 140, 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                        paddingTop: 16
                      }}
                    >
                      <Text size="sm" fw={500} c="dimmed" ta="center">
                        Select an occasion above to see how it works
                      </Text>
                    </Box>
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