// PlayerStatus.tsx
import React from 'react';
import {
  Group,
  Avatar,
  Indicator,
  Tooltip,
  Text,
  Paper,
  Button,
  Stack,
  ActionIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconDoorExit, 
  IconSettings,
  IconHourglass,
  IconMessageCircleHeart,
  IconCheck,
  IconCards,
  IconPawFilled,
  IconPlant2,
  IconMichelinStarGreen,
  IconAlpha,
  IconButterfly,
  IconCheese,
  IconHorseToy,
} from '@tabler/icons-react';
import type { Player } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';
import { useRoomHook } from '@/hooks/room/useRoomHook';

//
// Helper functions for seeded shuffling
//
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

const hashCode = (str: string) =>
  str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

//
// PlayerAvatar Component
//
interface PlayerAvatarProps {
  player: Player;
  roomId: string;
  isActive?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showReadyBadge?: boolean;
  animalIcon?: React.ElementType;
  animalBgColor?: string;
}

export function PlayerAvatar({
  player,
  isActive = false,
  showStatus = true,
  size = 'md',
  showReadyBadge = false,
  animalIcon,
  animalBgColor,
}: PlayerAvatarProps) {
  const avatar = (
    <Avatar
      radius="xl"
      size={size}
      sx={(theme) => ({
        backgroundColor: animalBgColor || theme.colors.blue[6],
        border: isActive
          ? `2px solid ${animalBgColor || theme.colors.blue[6]}`
          : undefined,
      })}
    >
      {animalIcon ? (
        // Render the assigned animal icon with a suitable size and white color
        React.createElement(animalIcon, { size: size === 'sm' ? 16 : 20, color: 'white' })
      ) : (
        player.username?.[0].toUpperCase() || 'P'
      )}
      {showReadyBadge && player.status === PLAYER_STATUS.BROWSING && (
        <Indicator inline size={10} position="bottom-end" color="green">
          <IconCheck size={8} />
        </Indicator>
      )}
    </Avatar>
  );

  const tooltipLabel = `${player.username || 'Player'} - ${player.status}`;

  return showStatus ? (
    <Tooltip label={tooltipLabel}>
      <Indicator
        size={6}
        offset={2}
        position="bottom-end"
        color={player.status === PLAYER_STATUS.BROWSING ? 'green' : 'gray'}
        withBorder
      >
        {avatar}
      </Indicator>
    </Tooltip>
  ) : (
    <Tooltip label={tooltipLabel}>{avatar}</Tooltip>
  );
}

//
// PlayerStatusBar Component
//
interface PlayerStatusBarProps {
  members: Player[];
  activePlayerId: string | null;
  roomId: string;
  variant?: 'compact' | 'full' | 'ready';
  showReadyCount?: boolean;
  isCreator?: boolean;
  gamePhase?: 'setup' | 'speaking';
  discardPileCount?: number;
  onDiscardPileClick?: () => void;
  handleLeaveRoom?: () => void;
}

export function PlayerStatusBar({
  members,
  activePlayerId,
  roomId,
  variant = 'compact',
  showReadyCount = false,
  isCreator = false,
  gamePhase,
  discardPileCount,
  onDiscardPileClick,
  handleLeaveRoom,  
}: PlayerStatusBarProps) {
  // Prepare a deterministic assignment of animal icons and background colors
  const animalIcons = [
    IconPawFilled,
    IconPlant2,
    IconMichelinStarGreen,
    IconAlpha,
    IconButterfly,
    IconCheese,
    IconHorseToy,
  ];
  const animalBgColors = [
    '#A3E635',
    '#60A5FA',
    '#FBBF24',
    '#F87171',
    '#34D399',
    '#6B7280',
    '#F472B6',
    '#FCD34D',
  ];

  const seedValue = hashCode(roomId);
  const shuffledIcons = shuffleArray(animalIcons, seedValue);
  const shuffledColors = shuffleArray(animalBgColors, seedValue + 1);

  // Sort players by user_id so that the assignment is unique per room
  const sortedMembers = [...members].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const assignment = new Map<string, { Icon: React.ElementType; bgColor: string }>();
  sortedMembers.forEach((player, index) => {
    assignment.set(player.id, {
      Icon: shuffledIcons[index % shuffledIcons.length],
      bgColor: shuffledColors[index % shuffledColors.length],
    });
  });

  const readyPlayers = members.filter(
    (p) => p.status === PLAYER_STATUS.BROWSING
  );
  const notReadyPlayers = members.filter(
    (p) => p.status !== PLAYER_STATUS.BROWSING
  );

  // For the "ready" variant, arrange avatars around the game phase icon.
  if (variant === 'ready') {
    return (
      <Paper p="md" radius="md" withBorder>
        <Group align="center">
          <Group align="center">
            {readyPlayers.map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                roomId={roomId}
                isActive={player.id === activePlayerId}
                size="sm"
                showReadyBadge
                animalIcon={assignment.get(player.id)?.Icon}
                animalBgColor={assignment.get(player.id)?.bgColor}
              />
            ))}
          </Group>

          <ActionIcon variant="default" size="lg">
            {gamePhase === 'setup' ? (
              <IconHourglass size={20} />
            ) : (
              <IconMessageCircleHeart size={20} />
            )}
          </ActionIcon>

          <Group align="center">
            {notReadyPlayers.map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                roomId={roomId}
                isActive={player.id === activePlayerId}
                size="sm"
                animalIcon={assignment.get(player.id)?.Icon}
                animalBgColor={assignment.get(player.id)?.bgColor}
              />
            ))}
          </Group>

          {typeof discardPileCount === 'number' && (
            <ActionIcon onClick={onDiscardPileClick} variant="light" size="lg">
              <Indicator
                label={discardPileCount}
                inline
                size={10}
                position="top-right"
              >
                <IconCards size={20} />
              </Indicator>
            </ActionIcon>
          )}

          {isCreator && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => {/* Open settings modal */}}
            >
              <IconSettings size={18} />
            </Button>
          )}
          <Button
            variant="subtle"
            size="sm"
            color="red"
            onClick={handleLeaveRoom}
          >
            <IconDoorExit size={18} />
          </Button>
        </Group>
      </Paper>
    );
  }

  // For the non-ready variants, display the avatars in a compact group.
  return (
    <Group spacing={4} align="center">
      {members.map((player) => (
        <PlayerAvatar
          key={player.id}
          player={player}
          roomId={roomId}
          isActive={player.id === activePlayerId}
          size={variant === 'compact' ? 'sm' : 'md'}
          animalIcon={assignment.get(player.id)?.Icon}
          animalBgColor={assignment.get(player.id)?.bgColor}
        />
      ))}
      {showReadyCount && (
        <Text size="sm" c="dimmed" ml="xs">
          {readyPlayers.length}/{members.length} ready
        </Text>
      )}
      {typeof discardPileCount === 'number' && (
        <ActionIcon onClick={onDiscardPileClick} variant="light" size="lg">
          <Indicator
            label={discardPileCount}
            inline
            size={10}
            position="top-right"
          >
            <IconCards size={20} />
          </Indicator>
        </ActionIcon>
      )}      
    </Group>    
  );
}
