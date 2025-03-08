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

// Progress bar component for audio playback
const AudioProgressBar = () => (
  <motion.div
    style={{ 
      width: '90%', 
      height: '4px', 
      backgroundColor: '#f1f3f5',
      borderRadius: '2px',
      overflow: 'hidden',
      position: 'relative',
      marginTop: '4px',
      marginBottom: '4px'
    }}
  >
    <motion.div
      initial={{ width: '0%' }}
      animate={{ width: '100%' }}
      transition={{ duration: 1.5 }}
      style={{
        height: '100%',
        backgroundColor: '#fd7e14',
        borderRadius: '2px'
      }}
    />
  </motion.div>
);

const StageTwoB = ({ selectedCardContent, onContinue }: StageTwoBProps) => {
  // Relative sizing values for interactive icons
  const iconButtonSize = '2em'; // container size for microphone/play buttons
  const smallIconSize = 14;     // small check icon for Player A
  const iconColorWhite = 'white';

  // Animation states
  const [showARecording, setShowARecording] = useState(true);
  const [messageSent, setMessageSent] = useState(false);
  const [showBListening, setShowBListening] = useState(false);
  const [playbackStarted, setPlaybackStarted] = useState(false);

  // Sequential animations (simulate recording → sent → partner listening)
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        setMessageSent(true);
        setShowARecording(false);
      }, 4000),
      setTimeout(() => {
        setShowBListening(true);
      }, 6000),
      setTimeout(() => {
        setPlaybackStarted(true);
      }, 7000)
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
      <Stack align="center" gap="sm">
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

          <Box>
            <Flex align="flex-start" justify="space-between">
              {/* Left side: Player A */}
              <Flex align="flex-start" style={{ flex: 1 }}>
                {/* Player A (You) - shown in full opacity when recording */}
                <motion.div
                  animate={{ opacity: messageSent ? 0.6 : 1 }}
                  transition={{ duration: 0.5 }}
                  style={{ 
                    width: 60, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <PlayerAvatar color="#228be6" delay={0} size={40} />
                    <Flex align="center" justify="center" mt={4}>
                      <Text size="xs" fw={600}>You</Text>
                      {messageSent && (
                        <IconCheck size={smallIconSize} color="#40c057" style={{ marginLeft: 4 }} />
                      )}
                    </Flex>
                  </Box>
                </motion.div>
                
                {/* Recording message */}
                <AnimatePresence>
                  {showARecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ 
                        marginLeft: 12
                      }}
                    >
                      <Box
                        style={{ 
                          backgroundColor: '#e7f5ff', 
                          borderRadius: 12,
                          padding: '8px 12px',
                          alignSelf: 'flex-start',
                          display: 'inline-block',
                          maxWidth: '100%'
                        }}
                      >
                        <Flex justify="space-between" align="center" gap="sm">
                          <AudioWave delay={0} />
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            style={{
                              width: iconButtonSize,
                              height: iconButtonSize,
                              borderRadius: '50%',
                              backgroundColor: '#fa5252',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}
                          >
                            <IconMicrophone size="1em" color={iconColorWhite} />
                          </motion.div>
                        </Flex>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Flex>

              {/* Right side: Player B with playback */}
              <Flex align="center" gap="sm">
                {/* Playback button (conditionally shown) */}
                <AnimatePresence>
                  {showBListening && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box
                        style={{ 
                          backgroundColor: '#fff3bf', 
                          borderRadius: 12,
                          padding: '8px 12px'
                        }}
                      >
                        <Stack gap="xs" style={{ width: '120px' }}>
                          <Flex justify="center" align="center">
                            <motion.div
                              animate={!playbackStarted ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                              transition={{ repeat: !playbackStarted ? Infinity : 0, duration: 1 }}
                              style={{
                                width: iconButtonSize,
                                height: iconButtonSize,
                                borderRadius: '50%',
                                backgroundColor: '#fd7e14',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                              }}
                            >
                              <IconPlayerPlay size="1em" color={iconColorWhite} />
                            </motion.div>
                          </Flex>
                          {playbackStarted && <AudioProgressBar />}
                        </Stack>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Player B avatar */}
                <Stack align="center" style={{ width: 60 }}>
                  <Box>
                    <PlayerAvatar color="#fd7e14" delay={0} size={40} />
                    <Text size="xs" fw={600}>Partner</Text>
                  </Box>
                </Stack>
              </Flex>
            </Flex>
            
            {/* Extra space for consistent height */}
            <Box style={{ height: '20px' }}></Box>
          </Box>
        </Paper>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.5 }}
        >
          <Button variant="light" size="md" radius="xl" onClick={onContinue}>
            Continue
          </Button>
        </motion.div>
      </Stack>
    </motion.div>
  );
};

export default StageTwoB;