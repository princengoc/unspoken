// TODO: could make more efficient by recording the order of the player that they joined the room
// this way the assignment can be computed independently of the other members' icons
import {
  IconPawFilled,
  IconPlant2,
  IconMichelinStarGreen,
  IconAlpha,
  IconButterfly,
  IconCheese,
  IconHorseToy,
} from "@tabler/icons-react";

import type { Player } from "@/core/game/types";

// Seeded random number generator for consistent assignments
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleArray<T>(array: T[], seed: number): T[] {
  const random = mulberry32(seed);
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const hashCode = (str: string): number => {
  if (!str) {
    return 0;
  } else {
    return str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
};

// Available icons and colors for player avatars
export const PLAYER_ICONS = [
  IconPawFilled,
  IconPlant2,
  IconMichelinStarGreen,
  IconAlpha,
  IconButterfly,
  IconCheese,
  IconHorseToy,
] as const;

export const PLAYER_COLORS = [
  "#A3E635", // Light green
  "#60A5FA", // Light blue
  "#FBBF24", // Yellow
  "#F87171", // Red
  "#34D399", // Teal
  "#6B7280", // Gray
  "#F472B6", // Pink
  "#FCD34D", // Light yellow
] as const;

export type PlayerAssignment = {
  Icon: (typeof PLAYER_ICONS)[number];
  bgColor: (typeof PLAYER_COLORS)[number];
};

// Get consistent player assignments for a room
export function getPlayerAssignments(
  members: Player[],
  roomId: string,
): Map<string, PlayerAssignment> {
  const seedValue = hashCode(roomId);
  const shuffledIcons = shuffleArray([...PLAYER_ICONS], seedValue);
  const shuffledColors = shuffleArray([...PLAYER_COLORS], seedValue + 1);

  // Sort players by ID for consistent assignment
  const sortedMembers = [...members].sort((a, b) => a.id.localeCompare(b.id));

  const assignment = new Map<string, PlayerAssignment>();
  sortedMembers.forEach((player, index) => {
    assignment.set(player.id, {
      Icon: shuffledIcons[index % shuffledIcons.length],
      bgColor: shuffledColors[index % shuffledColors.length],
    });
  });

  return assignment;
}
