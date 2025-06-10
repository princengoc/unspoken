// src/components/layout/NewSplashScreen.tsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Text,
  Title,
  Paper,
  Group,
  Transition,
  rem,
  useMantineTheme,
} from "@mantine/core";
import { IconBubbleText } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { SplashScreenProps } from "./types";
import { UnspokenGameTitle } from "@/core/game/unspokenIcon";

// Sample cards for selection
const SAMPLE_CARDS = [
  "A movie I would live in is ...",
  "If I could have dinner with anyone in the world, it would be...",
  "What I long for but am afraid to ask for is...",
];

const NewSplashScreen = ({
  visible,
  user,
  onLogin,
  onEnterLobby,
}: SplashScreenProps) => {
  const theme = useMantineTheme();
  const [currentStep, setCurrentStep] = useState<"draw" | "share" | "deepen">(
    "draw",
  );
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [showLogo, setShowLogo] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(true);

  // Handle card selection
  const handleCardSelect = (index: number) => {
    setSelectedCard(index);
    setCurrentStep("share");
  };

  const handleContinue = () => {
    setCurrentStep("deepen");
    setShowSkipIntro(false);
    // Show logo after "Deepen connections" appears
    setTimeout(() => setShowLogo(true), 1200);
    // Show CTA after logo appears
    setTimeout(() => setShowCTA(true), 2200);
  };

  const skipToEnd = () => {
    setSelectedCard(0);
    setCurrentStep("deepen");
    setShowSkipIntro(false);
    setShowLogo(true);
    setShowCTA(true);
  };

  useEffect(() => {
    if (user) skipToEnd();
  }, [user]);

  return (
    <Transition
      mounted={visible}
      transition="fade"
      duration={400}
      timingFunction="ease"
    >
      {(styles) => (
        <Box
          style={{
            ...styles,
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.primary[0],
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{ visibility: showSkipIntro ? "visible" : "hidden" }}>
            <Group justify="space-between" p="md">
              <Button
                variant="subtle"
                c={theme.colors.primary[7]}
                onClick={skipToEnd}
                size="sm"
                style={{
                  border: `1px solid ${theme.colors.primary[2]}`,
                }}
                styles={{
                  root: {
                    "&:hover": {
                      backgroundColor: theme.colors.primary[1],
                      border: `1px solid ${theme.colors.primary[3]}`,
                    },
                  },
                }}
              >
                Skip Intro
              </Button>
            </Group>
          </div>

          {/* Main content area */}
          <Box
            flex={1}
            display="flex"
            style={{ alignItems: "center", justifyContent: "center" }}
          >
            <Stack
              align="center"
              gap="xl"
              style={{ width: "100%", maxWidth: rem(600), padding: rem(20) }}
            >
              {/* Step 1: Draw a card */}
              {currentStep === "draw" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                  style={{ textAlign: "center", width: "100%" }}
                >
                  <Stack gap="xl" align="center">
                    <Title
                      order={1}
                      fw={400}
                      c={theme.colors.primary[8]}
                      ta="center"
                      style={{
                        fontSize: rem(32),
                        marginBottom: rem(20),
                      }}
                    >
                      Draw a card.
                    </Title>

                    <Group
                      justify="center"
                      gap="lg"
                      style={{ flexWrap: "wrap" }}
                    >
                      {SAMPLE_CARDS.map((content, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: index * 0.2 + 0.5,
                            duration: 0.4,
                          }}
                        >
                          <Paper
                            shadow="md"
                            p="lg"
                            radius="md"
                            onClick={() => handleCardSelect(index)}
                            style={{
                              backgroundColor: "white",
                              minHeight: rem(140),
                              width: rem(180),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${theme.colors.primary[2]}`,
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            styles={{
                              root: {
                                "&:hover": {
                                  backgroundColor: theme.colors.primary[0],
                                  border: `1px solid ${theme.colors.primary[3]}`,
                                  transform: "translateY(-4px)",
                                  boxShadow: theme.shadows.lg,
                                },
                              },
                            }}
                          >
                            <Text
                              size="md"
                              fw={400}
                              ta="center"
                              c={theme.colors.primary[9]}
                              style={{ lineHeight: 1.4 }}
                            >
                              {content}
                            </Text>
                          </Paper>
                        </motion.div>
                      ))}
                    </Group>
                  </Stack>
                </motion.div>
              )}

              {/* Step 2: Share your story */}
              {currentStep === "share" && (
                <Stack gap="xl" align="center">
                  <Title
                    order={1}
                    fw={400}
                    c={theme.colors.primary[8]}
                    ta="center"
                    style={{ fontSize: rem(32) }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      style={{ textAlign: "center", width: "100%" }}
                    >
                      Share your story.
                    </motion.div>
                  </Title>

                  {selectedCard !== null && (
                    <Paper
                      shadow="lg"
                      p="xl"
                      radius="md"
                      style={{
                        backgroundColor: theme.colors.primary[1],
                        minHeight: rem(140),
                        width: rem(300),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `2px solid ${theme.colors.primary[5]}`,
                      }}
                    >
                      <Text
                        size="lg"
                        fw={400}
                        ta="center"
                        c={theme.colors.primary[9]}
                        style={{ lineHeight: 1.4 }}
                      >
                        {SAMPLE_CARDS[selectedCard]}
                      </Text>
                    </Paper>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                  >
                    <Button
                      variant="light"
                      size="lg"
                      onClick={handleContinue}
                      style={{
                        fontSize: rem(16),
                        color: theme.colors.primary[7],
                        marginTop: rem(20),
                      }}
                    >
                      <IconBubbleText size={20} stroke={1.5} />
                    </Button>
                  </motion.div>
                </Stack>
              )}

              {/* Step 3: Deepen connections with logo reveal */}
              {currentStep === "deepen" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  style={{ textAlign: "center", width: "100%" }}
                >
                  <Stack gap="lg" align="center">
                    {/* Logo appears first */}
                    <div
                      style={{ visibility: showLogo ? "visible" : "hidden" }}
                    >
                      <UnspokenGameTitle order={1} />
                    </div>

                    {/* Tagline appears below logo */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Text
                        size="xl"
                        fw={400}
                        c={theme.colors.primary[7]}
                        ta="center"
                        style={{
                          fontSize: rem(24),
                          lineHeight: 1.3,
                        }}
                      >
                        Deepen connections.
                      </Text>
                    </motion.div>

                    {/* CTA appears last */}
                    <div style={{ visibility: showCTA ? "visible" : "hidden" }}>
                      <Button
                        size="xl"
                        variant="filled"
                        color="primary"
                        onClick={user ? onEnterLobby : onLogin}
                        radius="md"
                        style={{
                          fontSize: rem(18),
                          fontWeight: 500,
                          padding: `${rem(16)} ${rem(48)}`,
                          marginTop: rem(20),
                        }}
                      >
                        Start Game
                      </Button>
                    </div>
                  </Stack>
                </motion.div>
              )}
            </Stack>
          </Box>
        </Box>
      )}
    </Transition>
  );
};

export default NewSplashScreen;
