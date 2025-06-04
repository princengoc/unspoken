// src/components/layout/splash-stages/SharedComponents.tsx

import React from "react";
import { Box, Text, Paper } from "@mantine/core";
import { motion } from "framer-motion";

// Card component for animation
interface AnimatedCardProps {
  content: string;
  isSelected: boolean;
  delay: number;
  onSelect: () => void;
}

export const AnimatedCard = ({
  content,
  isSelected,
  delay,
  onSelect,
}: AnimatedCardProps) => {
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          borderColor: isSelected ? "#228be6" : undefined,
          borderWidth: isSelected ? 3 : 1,
          backgroundColor: isSelected ? "rgba(34, 139, 230, 0.05)" : undefined,
        }}
      >
        <Text fw={500} ta="center">
          {content}
        </Text>
      </Paper>
    </motion.div>
  );
};

// Avatar for animation
interface PlayerAvatarProps {
  color: string;
  delay: number;
  size?: number;
}

export const PlayerAvatar = ({
  color,
  delay,
  size = 40,
}: PlayerAvatarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 15 }}
    >
      <Box
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text c="white" fw={600} size="md">
          {color === "#228be6" ? "A" : "B"}
        </Text>
      </Box>
    </motion.div>
  );
};

// Speech bubble or audio wave animation
interface AudioWaveProps {
  delay: number;
}

export const AudioWave = ({ delay }: AudioWaveProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      style={{ display: "flex", gap: 4, alignItems: "center", height: 30 }}
    >
      {[0.7, 1, 0.6, 0.8, 0.5].map((height, i) => (
        <motion.div
          key={i}
          animate={{
            height: [height * 20, height * 30, height * 20],
            backgroundColor: ["#228be6", "#74c0fc", "#228be6"],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            delay: i * 0.2,
            repeatType: "reverse",
          }}
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: "#228be6",
          }}
        />
      ))}
    </motion.div>
  );
};
