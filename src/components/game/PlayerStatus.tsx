import React, { useState } from 'react';
import { Stack, Modal } from '@mantine/core';
import { motion } from 'framer-motion';
import type { GamePhase, Player } from '@/core/game/types';
import { getPlayerAssignments, shouldBeOnLeft, statusIcon } from './statusBarUtils';
import { PLAYER_STATUS } from '@/core/game/constants';
import { ProfileSettings } from '@/app/auth/ProfileSettings';
import { PlayerAvatar } from './PlayerAvatar';

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

  const renderPlayer = (player: Player) => {
    const isCurrentUser = player.id === currentUserId;
    const isActiveSpeaker = player.id === activePlayerId;
    const assignment = playerAssignments.get(player.id);
    
    if (!assignment) return null;
    
    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PlayerAvatar
          assignment={assignment}
          size="md"
          opacity={player.isOnline ? 1 : 0.5}
          highlighted={isCurrentUser || isActiveSpeaker}
          highlightColor={isCurrentUser ? 'green' : 'blue'}
          onClick={isCurrentUser ? handleAvatarClick : undefined}
          showTooltip={true}
          tooltipLabel={`${player.username} - ${player.status}`}
          showIndicator={true}
          indicatorIcon={statusIcon(player.status)}
          indicatorColor={isActiveSpeaker ? "blue" : "yellow"}
          indicatorProcessing={player.status === PLAYER_STATUS.SPEAKING}
        />
      </motion.div>
    );
  };

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
          {leftPlayers.map((player) => renderPlayer(player))}
        </Stack>

        {/* In progress players at the bottom */}
        <Stack gap="md" align="center">
          {rightPlayers.map((player) => renderPlayer(player))}
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