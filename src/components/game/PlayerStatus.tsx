import React from 'react';
import { Group, Avatar, Indicator, Tooltip, ActionIcon, Divider, Modal } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconCards, IconDoorExit, IconSettings, IconHourglass, IconMessageCircle } from '@tabler/icons-react';
import type { Player } from '@/core/game/types';
import { getPlayerAssignments, type PlayerAssignment, shouldBeOnLeft, statusIcon } from './statusBarUtils';
import { PLAYER_STATUS } from '@/core/game/constants';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { ProfileSettings } from '@/app/auth/ProfileSettings';

interface PlayerAvatarProps {
  player: Player;
  isCurrentUser: boolean;
  assignment: PlayerAssignment;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  player,
  isCurrentUser,
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
          border: isCurrentUser ? '3px solid green' : 'none',
          boxSizing: 'content-box',
          padding: isCurrentUser ? '2px' : '0',
        }
      })}
      style={{
        backgroundColor: bgColor,
        transition: 'all 0.2s ease',
      }}
      onClick={isCurrentUser ? onClick : undefined} // Only add onClick for current user
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
          processing={player.status === PLAYER_STATUS.SPEAKING}
          label={statusIcon(player.status)}
        >
          {avatarContent}
        </Indicator>
      </Tooltip>
    </motion.div>
  );
};

interface PlayerStatusBarProps {
  members: Player[];
  currentUserId: string | null;
  roomId: string;
  isCreator?: boolean;
  discardPileCount?: number;
  onDiscardPileClick?: () => void;
  handleLeaveRoom?: () => void;
  gamePhase: 'setup' | 'speaking';
}

export const PlayerStatusBar: React.FC<PlayerStatusBarProps> = ({
  members,
  currentUserId,
  roomId,
  isCreator,
  discardPileCount,
  onDiscardPileClick,
  handleLeaveRoom,
  gamePhase,
}) => {
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const playerAssignments = getPlayerAssignments(members, roomId);

  // Split players into left and right groups
  const leftPlayers = members.filter(player => shouldBeOnLeft(player, gamePhase));
  const rightPlayers = members.filter(player => !shouldBeOnLeft(player, gamePhase));

  const PhaseIcon = gamePhase === 'setup' ? IconHourglass : IconMessageCircle;

  const handleAvatarClick = () => {
    setProfileModalOpen(true);
  };

  return (
    <>
      <Group gap="xs" align="center" justify="space-between">
        {/* Left side players (completed/spoken) */}
        <Group gap="sm" align="center" justify='center'>
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
                // isCurrentUser={player.id === activePlayerId}
                isCurrentUser={true}
                assignment={playerAssignments.get(player.id)!}
                size="md"
                onClick={player.id === currentUserId ? handleAvatarClick : undefined}
              />
            </motion.div>
          ))}
        </Group>

        <Divider orientation='vertical' size="sm" />

        {/* Right side players (in progress) */}
        <Group gap="sm" align="center" justify='center'>
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
                isCurrentUser={player.id === currentUserId}
                assignment={playerAssignments.get(player.id)!}
                size="md"
                onClick={player.id === currentUserId ? handleAvatarClick : undefined}
              />
            </motion.div>
          ))}
          
          <Divider orientation='vertical' size="md" />
          
          {/* Action buttons */}
          <Group gap="xs" ml="md" justify="flex-end">
            {typeof discardPileCount === 'number' && (
              <ActionIcon onClick={onDiscardPileClick} variant="subtle" size="lg">
                <Indicator label={discardPileCount} inline size={16} position="top-end">
                  <IconCards size={20} />
                </Indicator>
              </ActionIcon>
            )}

              <ActionIcon variant="subtle" size="xl">
                <PhaseIcon size={24} />
              </ActionIcon>            
            
            {isCreator && (
              <ActionIcon variant="subtle" size="lg">
                <IconSettings size={20} />
              </ActionIcon>
            )}

            {isCreator && (
              <JoinRequests roomId={roomId} />
            )}          
            
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="lg"
              onClick={handleLeaveRoom}
            >
              <IconDoorExit size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Group>

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
};