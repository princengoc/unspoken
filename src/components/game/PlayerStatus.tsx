import React from 'react';
import { Group, Avatar, Indicator, Tooltip, Paper, ActionIcon, Center } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconCards, IconDoorExit, IconSettings, IconHourglass, IconMessageCircle } from '@tabler/icons-react';
import type { Player } from '@/core/game/types';
import { getPlayerAssignments, type PlayerAssignment, shouldBeOnLeft, statusIcon } from './statusBarUtils';
import { PLAYER_STATUS } from '@/core/game/constants';



interface PlayerAvatarProps {
  player: Player;
  isActive: boolean;
  assignment: PlayerAssignment;
  size?: 'sm' | 'md' | 'lg';
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isActive,
  assignment,
  size = 'md',
}) => {
  const { Icon, bgColor } = assignment;
  
  const avatarContent = (
    <Avatar
      radius="xl"
      size={size}
      style={{
        backgroundColor: bgColor,
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease',
        border: isActive ? '2px solid white' : 'none',
      }}
    >
      <Icon 
        size={size === 'sm' ? 16 : 20} 
        color="white"
        style={{ opacity: player.isOnline ? 1 : 0.5 }}
      />
    </Avatar>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
    <Tooltip label={`${player.username} - ${player.status}`}>
      <Indicator
        size={16}
        offset={2}
        position="bottom-end"
        withBorder
        color="yellow"
        processing={player.status===PLAYER_STATUS.SPEAKING}
        label={statusIcon(player.status)}
      >
        {avatarContent}
      </Indicator>
    </Tooltip>
    </motion.div>
  );
};


interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
}

const RoundIndicator: React.FC<RoundIndicatorProps> = ({ currentRound, totalRounds }) => {
  return (
    <Group spacing={4} align="center">
      {Array.from({ length: totalRounds }).map((_, idx) => (
        <motion.div
          key={idx}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div
            style={{
              width: idx === currentRound - 1 ? 12 : 8,
              height: idx === currentRound - 1 ? 12 : 8,
              borderRadius: '50%',
              background: idx < currentRound ? '#228BE6' : '#E9ECEF',
              transition: 'all 0.2s ease',
            }}
          />
        </motion.div>
      ))}
    </Group>
  );
};

interface PlayerStatusBarProps {
  members: Player[];
  activePlayerId: string | null;
  roomId: string;
  currentRound: number;
  totalRounds: number;
  isCreator?: boolean;
  discardPileCount?: number;
  onDiscardPileClick?: () => void;
  handleLeaveRoom?: () => void;
  gamePhase: 'setup' | 'speaking';
}

export const PlayerStatusBar: React.FC<PlayerStatusBarProps> = ({
  members,
  activePlayerId,
  roomId,
  currentRound,
  totalRounds,
  isCreator,
  discardPileCount,
  onDiscardPileClick,
  handleLeaveRoom,
  gamePhase,
}) => {
  const playerAssignments = getPlayerAssignments(members, roomId);

  // Split players into left and right groups
  const leftPlayers = members.filter(player => shouldBeOnLeft(player, gamePhase));
  const rightPlayers = members.filter(player => !shouldBeOnLeft(player, gamePhase));

  const PhaseIcon = gamePhase === 'setup' ? IconHourglass : IconMessageCircle;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group position="apart" align="center" spacing={0}>
        {/* Left side players (completed/spoken) */}
        <Group spacing={8} align="center">
          {leftPlayers.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <PlayerAvatar
                player={player}
                isActive={player.id === activePlayerId}
                assignment={playerAssignments.get(player.id)!}
                size="md"
              />
            </motion.div>
          ))}
        </Group>

        {/* Center section with phase icon and round indicator */}
        <Group spacing={16} align="center" mx="xl">
          <ActionIcon variant="light" size="xl" radius="xl">
            <PhaseIcon size={24} />
          </ActionIcon>
          <RoundIndicator currentRound={currentRound} totalRounds={totalRounds} />
        </Group>

        {/* Right side players (in progress) */}
        <Group spacing={8} align="center">
          {rightPlayers.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <PlayerAvatar
                player={player}
                isActive={player.id === activePlayerId}
                assignment={playerAssignments.get(player.id)!}
                size="md"
              />
            </motion.div>
          ))}

          {/* Action buttons */}
          <Group spacing={8} ml="md">
            {typeof discardPileCount === 'number' && (
              <ActionIcon onClick={onDiscardPileClick} variant="light" size="lg">
                <Indicator label={discardPileCount} inline size={16} position="top-end">
                  <IconCards size={20} />
                </Indicator>
              </ActionIcon>
            )}
            
            {isCreator && (
              <ActionIcon variant="light" size="lg">
                <IconSettings size={20} />
              </ActionIcon>
            )}
            
            <ActionIcon 
              variant="light" 
              color="red" 
              size="lg"
              onClick={handleLeaveRoom}
            >
              <IconDoorExit size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>
    </Paper>
  );
};