// src/components/layout/splash-stages/StageTwoB.tsx

import React, { useState } from 'react';
import { Stack, Title, Group, Text, Paper, Button, Box, Flex, Center, rem } from "@mantine/core";
import { IconMicrophone, IconPhoneCall, IconHome, IconPlayerPlay, IconCheck, IconSend } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar, AudioWave } from './SharedComponents';

interface StageTwoBProps {
  selectedCardContent: string;
  onContinue: () => void;
}

// Remote occasions
const RemoteOccasions = [
  {
    id: 'longdistance',
    icon: <IconPhoneCall style={{ color: '#228be6' }} stroke={1.5} />,
    title: 'Long Distance',
  },
  {
    id: 'family',
    icon: <IconHome style={{ color: '#fd7e14' }} stroke={1.5} />,
    title: 'Family Sharing',
  },
  {
    id: 'message',
    icon: <IconSend style={{ color: '#12b886' }} stroke={1.5} />,
    title: 'Send Messages',
  }
];

const StageTwoB = ({ selectedCardContent, onContinue }: StageTwoBProps) => {
  // Animation state
  const [animationStage, setAnimationStage] = useState<"recording" | "playback">("recording");
  
  // Start with recording, then transition to playback
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStage("playback");
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage2b"
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
              Connect anywhere
            </Title>
          </motion.div>

          <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 540 }}>
            <Stack gap="xl">              
              <Group justify="center" gap="xl">
                {RemoteOccasions.map((occasion, index) => (
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

              {/* Remote recording/playback visualization */}
              <Box 
                style={{ 
                  height: 180, 
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  paddingTop: 16,
                  position: 'relative'
                }}
              >
                <AnimatePresence mode="wait">
                  {/* Recording animation */}
                  {animationStage === "recording" && (
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
                                <Text size="sm" fw={500}>{selectedCardContent}</Text>
                                
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
                        
                        {/* Partner space */}
                        <Stack align="center" style={{ width: 60 }}>
                          <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                          <Text size="xs" fw={600}>Partner</Text>
                        </Stack>
                      </Flex>
                    </motion.div>
                  )}
                  
                  {/* Playback animation */}
                  {animationStage === "playback" && (
                    <motion.div
                      key="playback"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
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
                                    {selectedCardContent}
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
                  )}
                </AnimatePresence>
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

export default StageTwoB;