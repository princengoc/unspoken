import React, { useState } from 'react';
import { Stack, Avatar, Indicator, Tooltip, Modal } from '@mantine/core';
import { motion } from 'framer-motion';
import type { GamePhase, Player } from '@/core/game/types';
import { getPlayerAssignments, type PlayerAssignment, shouldBeOnLeft, statusIcon } from './statusBarUtils';
import { PLAYER_STATUS } from '@/core/game/constants';
import { ProfileSettings } from '@/app/auth/ProfileSettings';

interface PlayerAvatarProps {
  player: Player;
  isCurrentUser: boolean;
  isActiveSpeaker: boolean;
  assignment: PlayerAssignment;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isCurrentUser,
  isActiveSpeaker,
  assignment,
  size = 'md',
  onClick
}) => {
  const { Icon, bgColor } = assignment;
  
  const avatarContent = (
    <Avatar
      radius="xl"
      size={size}
      styles={(theme) => ({
        root: {
          border: isCurrentUser ? '3px solid green' : isActiveSpeaker ? '3px solid blue' : 'none',
          boxSizing: 'content-box',
          padding: (isCurrentUser || isActiveSpeaker) ? '2px' : '0',
          cursor: isCurrentUser ? 'pointer' : 'default',
        }
      })}
      style={{
        backgroundColor: bgColor,
        transition: 'all 0.2s ease',
      }}
      onClick={isCurrentUser ? onClick : undefined}
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
          color={isActiveSpeaker ? "blue" : "yellow"}
          processing={player.status === PLAYER_STATUS.SPEAKING}
          label={statusIcon(player.status)}
        >
          {avatarContent}
        </Indicator>
      </Tooltip>
    </motion.div>
  );
};

interface PlayerStatusProps {
  members: Player[];
  currentUserId: string | null;
  activePlayerId: string | null;
  roomId: string;
  gamePhase: GamePhase;
}

export function PlayerStatus({
  members,
  currentUserId,
  activePlayerId,
  roomId,
  gamePhase,
}: PlayerStatusProps) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const playerAssignments = getPlayerAssignments(members, roomId);

  // Split players into groups
  const leftPlayers = members.filter(player => shouldBeOnLeft(player, gamePhase));
  const rightPlayers = members.filter(player => !shouldBeOnLeft(player, gamePhase));

  const handleAvatarClick = () => {
    setProfileModalOpen(true);
  };

  return (
    <>
      <Stack 
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '80px',
          background: 'white',
          borderLeft: '1px solid #eee',
        }}
        p="md"
        justify="space-between"
      >
        {/* Completed/spoken players at the top */}
        <Stack gap="md" align="center">
          {leftPlayers.map((player) => (
            <PlayerAvatar
              key={player.id}
              player={player}
              isCurrentUser={player.id === currentUserId}
              isActiveSpeaker={player.id === activePlayerId}
              assignment={playerAssignments.get(player.id)!}
              size="md"
              onClick={player.id === currentUserId ? handleAvatarClick : undefined}
            />
          ))}
        </Stack>

        {/* In progress players at the bottom */}
        <Stack gap="md" align="center">
          {rightPlayers.map((player) => (
            <PlayerAvatar
              key={player.id}
              player={player}
              isCurrentUser={player.id === currentUserId}
              isActiveSpeaker={player.id === activePlayerId}
              assignment={playerAssignments.get(player.id)!}
              size="md"
              onClick={player.id === currentUserId ? handleAvatarClick : undefined}
            />
          ))}
        </Stack>
      </Stack>

      {/* Profile Modal */}
      <Modal
        opened={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile Settings"
        size="md"
      >
        <ProfileSettings />
      </Modal>
    </>
  );
}