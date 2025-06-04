// src/components/layout/splash-stages/StageThree.tsx

import React, { useState, useEffect } from "react";
import { Stack, Title, Text, Paper, Button, Box, Flex } from "@mantine/core";
import {
  IconExchange,
  IconCheck,
  IconQuestionMark,
  IconArrowRight,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerAvatar } from "./SharedComponents";

interface StageThreeProps {
  onContinue: () => void;
}

const StageThree = ({ onContinue }: StageThreeProps) => {
  const [step, setStep] = useState(0);

  // Auto-progress through the animation steps with slower speed
  useEffect(() => {
    if (step < 5) {
      const timer = setTimeout(() => {
        setStep(step + 1);
      }, 1500); // Slower animations
      return () => clearTimeout(timer);
    }
    // make lint happy
    return undefined;
  }, [step]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="stage3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Stack align="center" gap="md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Title order={3} ta="center" c="white">
              Ask & Approve
            </Title>
          </motion.div>

          {/* Main container */}
          <Paper
            p="xl"
            radius="md"
            style={{
              width: "100%",
              maxWidth: 520,
              backgroundColor: "white",
              position: "relative",
              height: 260,
            }}
          >
            {/* Avatars row with exchange icon in middle */}
            <Flex justify="space-between" align="center" mb={40}>
              <PlayerAvatar color="#228be6" delay={0} size={45} />

              {/* Exchange Icon in center */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  backgroundColor:
                    step >= 4
                      ? "rgba(0, 200, 0, 0.15)"
                      : "rgba(0, 0, 255, 0.05)",
                }}
                transition={{ duration: 0.5 }}
                style={{
                  borderRadius: "50%",
                  padding: 8,
                  display: "flex",
                }}
              >
                <IconExchange
                  size={28}
                  color={step >= 4 ? "#4CAF50" : "#228be6"}
                />
              </motion.div>

              <Box style={{ marginRight: 10 }}>
                <PlayerAvatar color="#ff6b6b" delay={0} size={45} />
              </Box>
            </Flex>

            {/* The cards and suggestion/approval flow */}
            <Box style={{ position: "relative", height: 140 }}>
              {/* A's card */}
              <motion.div
                initial={{ opacity: 0, x: "-60%" }}
                animate={{
                  opacity: step >= 1 ? 1 : 0,
                  x: step < 1 ? "-60%" : step < 4 ? "-30%" : "30%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 15,
                  duration: 0.9,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                }}
              >
                <Paper
                  shadow="sm"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    width: 120,
                    height: 70,
                    borderColor: step >= 4 ? "#ff6b6b" : "#e0e0e0",
                    borderWidth: step >= 4 ? 2 : 1,
                    position: "relative",
                    transform: "translateX(-50%)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Stack gap={5} align="center">
                    {step < 4 ? (
                      <>
                        <Text size="xs" fw={500} c="#228be6">
                          Would you answer this...
                        </Text>
                        <IconQuestionMark
                          size={20}
                          color="#228be6"
                          style={{ opacity: 0.8 }}
                        />
                      </>
                    ) : (
                      <>
                        <IconCheck
                          size={20}
                          color="#4CAF50"
                          style={{ opacity: 0.8 }}
                        />
                      </>
                    )}
                  </Stack>
                </Paper>
              </motion.div>

              {/* B's card */}
              <motion.div
                initial={{ opacity: 0, x: "60%" }}
                animate={{
                  opacity: step >= 2 ? 1 : 0,
                  x: step < 2 ? "60%" : step < 4 ? "30%" : "-30%",
                }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 15,
                  duration: 0.9,
                }}
                style={{
                  position: "absolute",
                  top: 80,
                  left: "50%",
                }}
              >
                <Paper
                  shadow="sm"
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    width: 120,
                    height: 60,
                    borderColor: step >= 4 ? "#228be6" : "#e0e0e0",
                    borderWidth: step >= 4 ? 2 : 1,
                    position: "relative",
                    transform: "translateX(-50%)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Stack gap={5} align="center">
                    {step < 4 ? (
                      <>
                        <Text size="xs" fw={500} c="#ff6b6b">
                          Would you answer this...
                        </Text>
                        <IconQuestionMark
                          size={20}
                          color="#ff6b6b"
                          style={{ opacity: 0.8 }}
                        />
                      </>
                    ) : (
                      <>
                        <IconCheck
                          size={20}
                          color="#4CAF50"
                          style={{ opacity: 0.8 }}
                        />
                      </>
                    )}
                  </Stack>
                </Paper>
              </motion.div>

              {/* A's arrow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: step >= 1 && step < 4 ? 1 : 0,
                }}
                transition={{ duration: 0.5 }}
                style={{
                  position: "absolute",
                  top: 20,
                  left: "70%",
                }}
              >
                <IconArrowRight size={24} color="#228be6" />
              </motion.div>

              {/* B's arrow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: step >= 2 && step < 4 ? 1 : 0,
                }}
                transition={{ duration: 0.5 }}
                style={{
                  position: "absolute",
                  top: 100,
                  right: "70%",
                  transform: "rotate(180deg)",
                }}
              >
                <IconArrowRight size={24} color="#ff6b6b" />
              </motion.div>
            </Box>
          </Paper>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: step >= 4 ? 1 : 0, y: step >= 4 ? 0 : 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            style={{ marginTop: 10 }}
          >
            <Button variant="light" size="md" radius="xl" onClick={onContinue}>
              Continue
            </Button>
          </motion.div>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default StageThree;
