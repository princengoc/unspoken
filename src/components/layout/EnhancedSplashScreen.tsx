// src/components/layout/EnhancedSplashScreen.tsx

import React, { useState, useEffect } from 'react';
import { Box, Stack, Text, Button, Title, Group, Paper, Badge } from "@mantine/core";
import { IconChevronDown, IconMicrophone, IconMessages, IconExchange, IconHeart } from "@tabler/icons-react";
import { motion, AnimatePresence } from 'framer-motion';
import { UnspokenGameTitle } from "@/core/game/unspokenIcon";

// Card component for animation
const AnimatedCard = ({ content, isSelected, delay, onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
    >
      <Paper
        shadow="md"
        p="md"
        radius="md"
        withBorder
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderColor: isSelected ? '#228be6' : undefined,
          borderWidth: isSelected ? 3 : 1,
          backgroundColor: isSelected ? 'rgba(34, 139, 230, 0.05)' : undefined,
        }}
      >
        <Text fw={500} ta="center">{content}</Text>
      </Paper>
    </motion.div>
  );
};

// Avatar for animation
const PlayerAvatar = ({ color, delay, size = 40 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 15 }}
    >
      <Box 
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text c="white" fw={600} size="md">
          {color === '#228be6' ? 'A' : 'B'}
        </Text>
      </Box>
    </motion.div>
  );
};

// Speech bubble or audio wave animation
const AudioWave = ({ delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      style={{ display: 'flex', gap: 4, alignItems: 'center', height: 30 }}
    >
      {[0.7, 1, 0.6, 0.8, 0.5].map((height, i) => (
        <motion.div
          key={i}
          animate={{ 
            height: [height * 20, height * 30, height * 20], 
            backgroundColor: ['#228be6', '#74c0fc', '#228be6']
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            delay: i * 0.2,
            repeatType: 'reverse'
          }}
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: '#228be6',
          }}
        />
      ))}
    </motion.div>
  );
};

// Main animation component
const AnimationSequence = ({ onComplete, isLoggedIn }) => {
  const [stage, setStage] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  
  const cards = [
    "What fear did you overcome that made you stronger?",
    "Describe a moment when you felt truly peaceful",
    "Share a time when you were proud of yourself"
  ];

  const exchangeCards = [
    "What's a hope you have for the future?",
    "Describe a childhood memory that shaped you"
  ];

  useEffect(() => {
    // Auto-progress through stages
    const timer = setTimeout(() => {
      if (stage < 4) {
        setStage(stage + 1);
      } else {
        onComplete && onComplete();
      }
    }, stage === 0 ? 4000 : 5000); // First stage shorter

    return () => clearTimeout(timer);
  }, [stage, onComplete]);

  // Handle card selection in first stage
  const handleCardSelect = (index) => {
    setSelectedCard(index);
  };

  return (
    <Box py={40}>
      <AnimatePresence mode="wait">
        {/* Stage 1: Draw Cards */}
        {stage === 0 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Stack align="center" gap="xl">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Title order={3} ta="center" mb="lg" c="white">Draw cards, select one that sparks a story</Title>
              </motion.div>
              
              <Group justify="center" gap="lg">
                {cards.map((content, index) => (
                  <AnimatedCard 
                    key={index}
                    content={content}
                    delay={index * 0.3 + 0.8}
                    isSelected={selectedCard === index}
                    onSelect={() => handleCardSelect(index)}
                  />
                ))}
              </Group>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
              >
                <Text size="sm" fw={500} c="white" mt="md">
                  Tap a card to select it
                </Text>
              </motion.div>
            </Stack>
          </motion.div>
        )}

        {/* Stage 2: Story Sharing */}
        {stage === 1 && (
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
                        {cards[selectedCard !== null ? selectedCard : 0]}
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
            </Stack>
          </motion.div>
        )}

        {/* Stage 3: Exchange */}
        {stage === 2 && (
          <motion.div
            key="stage3"
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
                  Ask & exchange questions with others
                </Title>
              </motion.div>
              
              <Group align="center" position="apart" style={{ width: '100%', maxWidth: 600 }}>
                <Stack align="center" gap="md">
                  <PlayerAvatar color="#228be6" delay={0.5} />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Paper shadow="sm" p="xs" radius="md" withBorder style={{ width: 150, height: 120 }}>
                      <Text size="sm" ta="center">
                        {exchangeCards[0]}
                      </Text>
                    </Paper>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <Text size="xs" c="white">Asks Player B</Text>
                  </motion.div>
                </Stack>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.4, type: 'spring' }}
                >
                  <IconExchange size={40} color="white" />
                </motion.div>
                
                <Stack align="center" gap="md">
                  <PlayerAvatar color="#ff6b6b" delay={0.7} />
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Paper shadow="sm" p="xs" radius="md" withBorder style={{ width: 150, height: 120 }}>
                      <Text size="sm" ta="center">
                        {exchangeCards[1]}
                      </Text>
                    </Paper>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                  >
                    <Text size="xs" c="white">Asks Player A</Text>
                  </motion.div>
                </Stack>
              </Group>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                <Text c="white" ta="center" mt="sm" size="sm">
                  Exchange questions that matter to you
                </Text>
              </motion.div>
            </Stack>
          </motion.div>
        )}

        {/* Stage 4: Game Recap */}
        {stage === 3 && (
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
            </Stack>
          </motion.div>
        )}

        {/* Stage 5: Call to Action */}
        {stage === 4 && (
          <motion.div
            key="stage5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Stack align="center" gap="xl">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <Paper
                  shadow="md"
                  p="xl"
                  radius="lg"
                  withBorder
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    maxWidth: 500
                  }}
                >
                  <Stack align="center" gap="md">
                    <UnspokenGameTitle size={2} />
                    <Text size="xl" fw={300} c="white" ta="center">
                      A game of cards, a journey of words.
                    </Text>
                  </Stack>
                </Paper>
              </motion.div>
              
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: '#6B73FF', to: '#000DFF' }}
                    rightSection={<IconChevronDown size={20} />}
                    onClick={onComplete}
                  >
                    Enter Lobby
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: '#6B73FF', to: '#000DFF' }}
                    onClick={onComplete}
                  >
                    Start Playing
                  </Button>
                )}
              </motion.div>
            </Stack>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// Enhanced Splash Screen Component
const EnhancedSplashScreen = ({ visible, user, loading, onLogin, onEnterLobby }) => {
  // To allow skipping the animation if desired
  const [showAnimation, setShowAnimation] = useState(true);
  
  // Function to immediately skip to the CTA
  const skipToEnd = () => {
    setShowAnimation(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: visible ? 'block' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
        overflow: 'auto',
        padding: '20px'
      }}
    >
      {/* Header with user controls */}
      <Group justify="space-between" p="md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="subtle" color="white" onClick={skipToEnd}>
            Skip Intro
          </Button>
        </motion.div>
        
        {user ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              variant="white" 
              onClick={onEnterLobby}
              radius="xl"
            >
              Enter Lobby
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              variant="white" 
              onClick={onLogin} 
              loading={loading}
              radius="xl"
            >
              Login
            </Button>
          </motion.div>
        )}
      </Group>

      {/* Main content */}
      <Box style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showAnimation ? (
          <AnimationSequence 
            onComplete={() => {
              setShowAnimation(false);
              onEnterLobby();
            }}
            isLoggedIn={!!user}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Stack align="center" gap="xl">
              <Paper
                radius="lg"
                p="xl"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <Stack align="center" gap="md">
                  <UnspokenGameTitle size={2} />
                  <Text size="xl" fw={300} c="white">
                    A game of cards, a journey of words.
                  </Text>
                </Stack>
              </Paper>

              {user ? (
                <Button
                  size="lg"
                  radius="xl"
                  variant="white"
                  color="indigo"
                  rightSection={<IconChevronDown size={20} />}
                  onClick={onEnterLobby}
                >
                  Enter Lobby
                </Button>
              ) : (
                <Button
                  size="lg"
                  radius="xl"
                  variant="white"
                  color="indigo"
                  onClick={onLogin}
                  loading={loading}
                >
                  Start Playing
                </Button>
              )}
            </Stack>
          </motion.div>
        )}
      </Box>

      {/* Scroll indicator */}
      <Box
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: 'center'
        }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <IconChevronDown size={32} color="white" onClick={onEnterLobby} style={{ cursor: 'pointer' }} />
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default EnhancedSplashScreen;