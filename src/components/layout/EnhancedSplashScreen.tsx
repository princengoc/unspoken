// src/components/layout/EnhancedSplashScreen.tsx

import React, { useState } from "react";
import { Box, Group, Button } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { SplashScreenProps } from "./types";

// Import stage components
import {
  StageOne,
  StageTwoA,
  StageTwoB,
  StageThree,
  StageFour,
  StageFive,
} from "./splash-stages";

// Enhanced Splash Screen Component
const EnhancedSplashScreen = ({
  visible,
  user,
  loading,
  onLogin,
  onEnterLobby,
}: SplashScreenProps) => {
  // Current stage of the tutorial
  const [stage, setStage] = useState(0);

  // Selected card in stage one
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Function to advance to the next stage
  const goToNextStage = () => {
    setStage((prev) => prev + 1);
  };

  // Function to immediately skip to the CTA
  const skipToEnd = () => {
    setStage(4);
  };

  // Function to handle card selection in first stage
  const handleCardSelect = (index: number) => {
    setSelectedCard(index);
  };

  // Card content for the different stages
  const cards = [
    "I pretend I don’t care about .... but I do.",
    "My most irrational fear is ...",
    "A movie I would live in is ...",
  ];

  // Function to complete the tutorial and enter lobby
  const completeAndEnterLobby = () => {
    onEnterLobby();
  };

  // Render current stage based on state
  const renderStage = () => {
    switch (stage) {
      case 0:
        return (
          <StageOne
            cards={cards}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
            onContinue={goToNextStage}
          />
        );
      case 1:
        return (
          <StageTwoA
            selectedCardContent={
              cards[selectedCard !== null ? selectedCard : 0]
            }
            onContinue={goToNextStage}
          />
        );
      case 2:
        return (
          <StageTwoB
            selectedCardContent={
              cards[selectedCard !== null ? selectedCard : 0]
            }
            onContinue={goToNextStage}
          />
        );
      case 3:
        return <StageThree onContinue={goToNextStage} />;
      case 4:
        return <StageFour onContinue={goToNextStage} />;
      case 5:
        return (
          <StageFive isLoggedIn={!!user} onComplete={completeAndEnterLobby} />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: visible ? "block" : "none",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        background: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
        overflow: "auto",
        padding: "20px",
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
            <Button variant="white" onClick={onEnterLobby} radius="xl">
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
      <Box
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {renderStage()}
      </Box>

      {/* Scroll indicator */}
      <Box
        style={{
          position: "absolute",
          bottom: 50,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <IconChevronDown
            size={32}
            color="white"
            onClick={onEnterLobby}
            style={{ cursor: "pointer" }}
          />
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default EnhancedSplashScreen;
