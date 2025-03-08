// src/components/layout/splash-stages/StageTwoB.tsx

import React, { useState, useEffect } from 'react';
import { Stack, Title, Text, Paper, Button, Box, Flex } from "@mantine/core";
import { IconMicrophone, IconPlayerPlay, IconCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerAvatar, AudioWave } from './SharedComponents';

interface StageTwoBProps {
  selectedCardContent: string;
  onContinue: () => void;
}

const StageTwoB = ({ selectedCardContent, onContinue }: StageTwoBProps) => {
  // Animation states - simplified to just three stages
  const [showARecording, setShowARecording] = useState(true);
  const [showASent, setShowASent] = useState(false);
  const [showBListening, setShowBListening] = useState(false);
  const [playButtonAnimating, setPlayButtonAnimating] = useState(true);
  
  // Sequential animations with slower transitions
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setShowASent(true);
        setShowARecording(false);
      }, 4000),
      setTimeout(() => {
        setShowBListening(true);
      }, 6000),
      setTimeout(() => {
        setPlayButtonAnimating(false);
      }, 8000)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Stack align="center" gap="md">
        <Title order={3} ta="center" mb="xs" c="white">
          Connect with voice messages
        </Title>

        <Paper shadow="md" p="lg" radius="md" withBorder style={{ maxWidth: 520 }}>
          {/* Card content reference */}
          <Box mb="md" p="xs" style={{ backgroundColor: 'rgba(241, 243, 245, 0.5)', borderRadius: 8 }}>
            <Text size="sm" ta="center" fw={500}>
              Sharing: "{selectedCardContent}"
            </Text>
          </Box>

          <Box style={{ minHeight: 220 }}>
            <Flex align="flex-start">
              {/* Player A (You) */}
              <Stack align="center" style={{ width: 60 }}>
                <Box style={{ 
                  opacity: showBListening ? 0.5 : 1 
                }}>
                  <PlayerAvatar 
                    color="#228be6" 
                    delay={0} 
                    size={40} 
                  />
                  <Text size="xs" fw={600}>You</Text>
                </Box>
              </Stack>
              
              {/* Middle: Conversation Area - Fixed height to prevent re-flow */}
              <Box 
                style={{ 
                  flex: 1, 
                  marginLeft: 12, 
                  marginRight: 12, 
                  minHeight: 220,
                  position: 'relative'  
                }}
              >
                {/* A Recording - Initial state */}
                <AnimatePresence>
                  {showARecording && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%' 
                      }}
                    >
                      <Flex direction="column" gap="md">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.7 }}
                          style={{ 
                            backgroundColor: '#e7f5ff', 
                            borderRadius: 12,
                            padding: '12px 16px',
                            alignSelf: 'flex-start',
                            maxWidth: '85%'
                          }}
                        >
                          <Flex justify="space-between" align="center" gap="md">
                            <AudioWave delay={0} />
                            
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
                          </Flex>
                        </motion.div>
                        
                      </Flex>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* A Sent Confirmation */}
                <AnimatePresence>
                  {showASent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%' 
                      }}
                    >
                      <Flex direction="column" gap="md">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.7 }}
                          style={{ 
                            backgroundColor: '#e7f5ff', 
                            borderRadius: 12,
                            padding: '12px 16px',
                            alignSelf: 'flex-start',
                            maxWidth: '85%'
                          }}
                        >
                          <Flex justify="space-between" align="center" gap="md">
                            <AudioWave delay={0} />
                            
                            <Box
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#40c057',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <IconCheck size={20} color="white" />
                            </Box>
                          </Flex>
                        </motion.div>
                      </Flex>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* B Listening to A's message */}
                <AnimatePresence>
                  {showBListening && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%' 
                      }}
                    >
                      <Flex direction="column" gap="md">
                        {/* A's sent message stays visible but dimmed */}
                        <motion.div
                          style={{ 
                            backgroundColor: '#e7f5ff', 
                            borderRadius: 12,
                            padding: '12px 16px',
                            alignSelf: 'flex-start',
                            maxWidth: '85%',
                            opacity: 0.5
                          }}
                        >
                          <Flex justify="space-between" align="center" gap="md">
                            <AudioWave delay={0} />
                            
                            <Box
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#40c057',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <IconCheck size={20} color="white" />
                            </Box>
                          </Flex>
                        </motion.div>
                        
                        {/* B receiving message */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5, duration: 0.7 }}
                          style={{ 
                            backgroundColor: '#fff3bf', 
                            borderRadius: 12,
                            padding: '12px 16px',
                            alignSelf: 'flex-end',
                            maxWidth: '85%'
                          }}
                        >
                          <Flex justify="space-between" align="center" gap="md">
                            <motion.div
                              animate={playButtonAnimating ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                              transition={{ 
                                repeat: playButtonAnimating ? Infinity : 0,
                                duration: 2
                              }}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: '#fd7e14',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <IconPlayerPlay size={20} color="white" />
                            </motion.div>
                            
                            <AudioWave delay={0} />
                          </Flex>
                        </motion.div>
                        
                      </Flex>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
              
              {/* Player B (Partner) */}
              <Stack align="center" style={{ width: 60 }}>
                <Box style={{ opacity: !showBListening ? 0.5 : 1 }}>
                  <PlayerAvatar 
                    color="#fd7e14" 
                    delay={0} 
                    size={40} 
                  />
                  <Text size="xs" fw={600}>Partner</Text>
                </Box>
              </Stack>
            </Flex>
          </Box>
        </Paper>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.7 }}
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
  );
};

export default StageTwoB;