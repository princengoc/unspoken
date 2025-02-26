import React from "react";
import {
  Card as MantineCard,
  Text,
  Avatar,
  Stack,
  rem,
  Box,
  Tooltip,
} from "@mantine/core";
import { motion } from "framer-motion";
import type { Card as CardType } from "@/core/game/types";
import {
  IconCirclesRelation,
  IconIkosaedr,
  IconCell,
  IconEar,
  IconMicrophone,
} from "@tabler/icons-react";
import type { PlayerAssignment } from "../statusBarUtils";
import { PlayerAvatar } from "../PlayerAvatar";

/** Mood types that represent different emotional states */
export type MoodType = "Expansive" | "Centered" | "Introspective";

export const moods: {
  type: MoodType;
  icon: typeof IconCirclesRelation;
  color: string;
}[] = [
  {
    type: "Expansive",
    icon: IconCirclesRelation,
    color: "#E67E22",
  },
  {
    type: "Centered",
    icon: IconIkosaedr,
    color: "#8E44AD",
  },
  {
    type: "Introspective",
    icon: IconCell,
    color: "#C0392B",
  },
];

export const moodConfig = {
  Expansive: {
    icon: IconCirclesRelation,
    color: "#E67E22", // Warm orange
    glow: "0 0 15px rgba(230, 126, 34, 0.5)",
  },
  Centered: {
    icon: IconIkosaedr,
    color: "#8E44AD", // Rich purple
    glow: "0 0 15px rgba(142, 68, 173, 0.5)",
  },
  Introspective: {
    icon: IconCell,
    color: "#C0392B", // Deep red
    glow: "0 0 15px rgba(192, 57, 43, 0.5)",
  },
};

export interface MiniCardProps {
  card: CardType;
  mood?: MoodType;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  showSender?: boolean;
  contributorName?: string | null;
  contributorAssignment?: PlayerAssignment;
  playerAssignment?: PlayerAssignment;
  playerName?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

export function MiniCard({
  card,
  mood,
  isSelected = false,
  isHighlighted = false,
  onClick,
  showSender = false,
  contributorAssignment,
  contributorName,
  playerAssignment,
  playerName,
  size = "md",
}: MiniCardProps) {
  const moodStyles = mood ? moodConfig[mood] : null;
  const IconComponent = moodStyles?.icon;

  // Card dimensions based on size
  const cardDimensions = {
    xs: { width: "100px", height: "110px", iconSize: 14, fontSize: "xs" },
    sm: { width: "120px", height: "130px", iconSize: 18, fontSize: "xs" },
    md: { width: "150px", height: "160px", iconSize: 24, fontSize: "sm" },
    lg: { width: "180px", height: "190px", iconSize: 28, fontSize: "md" },
  };

  const { width, height, iconSize, fontSize } = cardDimensions[size];

  // Highlight colors and effects
  const highlightColor = "#228BE6"; // Bright blue
  const highlightBackgroundColor = "rgba(34, 139, 230, 0.05)";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={
        isSelected
          ? {
              boxShadow: [
                moodStyles?.glow || "0 0 15px rgba(0, 0, 0, 0.2)",
                "0 0 2px rgba(0, 0, 0, 0.1)",
              ],
            }
          : isHighlighted
            ? {
                boxShadow: ["0 0 5px rgba(34, 139, 230, 0.3)"],
              }
            : {}
      }
      transition={{
        duration: 0.3,
        repeat: isSelected ? Infinity : 0,
        repeatType: "reverse",
      }}
    >
      <MantineCard
        shadow="sm"
        padding="sm"
        radius="md"
        style={{
          cursor: onClick ? "pointer" : "default",
          borderColor: isHighlighted
            ? highlightColor
            : isSelected
              ? moodStyles?.color
              : undefined,
          borderWidth: isSelected || isHighlighted ? "2px" : "1px",
          width: width,
          height: height,
          backgroundColor: isHighlighted ? highlightBackgroundColor : undefined,
        }}
        onClick={onClick}
      >
        <Stack gap="sm" h="100%">
          {IconComponent && (
            <div
              style={{
                position: "absolute",
                bottom: rem(4),
                right: rem(4),
                color: moodStyles?.color,
              }}
            >
              <IconComponent size={iconSize} />
            </div>
          )}

          {/* Highlight indicator */}
          {isHighlighted && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "5px",
                background: highlightColor,
                borderTopLeftRadius: "7px",
                borderTopRightRadius: "7px",
              }}
            />
          )}

          {/* Player who used this card - top right corner */}
          {playerAssignment && (
            <Tooltip label={playerName || "Speaker"} position="top" withArrow>
              <Box
                style={{
                  position: "absolute",
                  top: rem(4),
                  right: rem(4),
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PlayerAvatar
                  assignment={playerAssignment}
                  size="xs"
                  showTooltip={false}
                />
                <IconMicrophone size={14} />
              </Box>
            </Tooltip>
          )}

          {/* Contributor/Sender - bottom left corner */}
          {showSender && contributorAssignment && (
            <Tooltip
              label={
                "Asked by " + contributorName ||
                card.contributor_id ||
                "Anonymous"
              }
              position="bottom"
              withArrow
            >
              <Box
                style={{
                  position: "absolute",
                  bottom: rem(4),
                  left: rem(4),
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PlayerAvatar
                  assignment={contributorAssignment}
                  size="xs"
                  showTooltip={false}
                />
                <IconEar size={14} />
              </Box>
            </Tooltip>
          )}

          {/* Fallback for contributor when no PlayerAssignment is available */}
          {showSender && !contributorAssignment && card.contributor_id && (
            <Tooltip
              label={`Contributor: ${card.contributor_id}`}
              position="bottom"
              withArrow
            >
              <Box
                style={{
                  position: "absolute",
                  bottom: rem(4),
                  left: rem(4),
                  zIndex: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Avatar size="xs" radius="xl" color="gray">
                  {card.contributor_id.charAt(0).toUpperCase()}
                </Avatar>
                <IconEar size={14} />
              </Box>
            </Tooltip>
          )}

          <Text
            size={fontSize}
            fw={500}
            ta="center"
            mt={rem(16)}
            style={{
              flex: 1,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              lineHeight: "1.4",
            }}
          >
            {card.content}
          </Text>
        </Stack>
      </MantineCard>
    </motion.div>
  );
}
