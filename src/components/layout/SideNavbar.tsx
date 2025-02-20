// src/components/layout/SideNavbar.tsx

import React, { useState, useMemo } from 'react';
import { Stack, ActionIcon, Tooltip, Indicator, Divider, Modal, Text } from '@mantine/core';
import { IconDoorExit, IconHourglass, IconMessageCircle, IconCards, IconCheck, IconHelp, IconExchange } from '@tabler/icons-react';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { type GamePhase } from '@/core/game/types';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useExchanges } from '@/context/ExchangesProvider';
import { PlayerAvatar } from '@/components/game/PlayerAvatar';
import { getPlayerAssignments } from '@/components/game/statusBarUtils';
import { ProfileSettings } from '@/app/auth/ProfileSettings';
import { PLAYER_STATUS } from '@/core/game/constants';

interface SideNavbarProps {
  roomId: string;
  isCreator: boolean;
  gamePhase: GamePhase;
  handleLeaveRoom?: () => void;
  onViewChange?: (view: 'cards' | 'exchange' | 'waiting') => void;
}

export function SideNavbar({
  roomId,
  isCreator,
  gamePhase,
  handleLeaveRoom,
  onViewChange,
}: SideNavbarProps) {
  const { members, currentMember } = useRoomMembers();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const playerAssignments = getPlayerAssignments(members, roomId);
  
  // Since ExchangesProvider is at the room level, we can directly use useExchanges here
  const { incomingRequests, hasMatch } = useExchanges();
  
  const exchangeUpdatesCount = useMemo(() => {
    return incomingRequests.filter(req => req.status === 'pending').length;
  }, [incomingRequests]);

  // Get appropriate phase icon
  const PhaseIcon = (() => {
    switch (gamePhase) {
      case 'setup': return IconHourglass;
      case 'speaking': return IconMessageCircle;
      case 'endgame': return IconCards;
      default: return IconHourglass;
    }
  })();

  // Get help text based on current phase
  const getHelpText = () => {
    switch (gamePhase) {
      case 'setup':
        return "Setup Phase: Select a card to share with the group. You can also exchange cards with other players. Once everyone is ready, the game will begin.";
      case 'speaking':
        return "Speaking Phase: Each player shares their chosen card. When it's your turn, click 'Start Sharing' to begin. Listeners can react to what you share. Click 'Finish Sharing' when done.";
      case 'endgame':
        return "Game Complete: Review what everyone shared. The room creator can start an encore round with rippled cards from the previous round.";
      default:
        return "Select a card to share with the group. You can exchange cards with other players.";
    }
  };

  // Handle phase icon click to toggle between waiting and main view in setup
  // Only enable certain actions when in setup phase and when appropriate
  const canViewExchange = currentMember?.status === PLAYER_STATUS.BROWSING;
  const canViewWaiting = currentMember?.status === PLAYER_STATUS.BROWSING;

  const handlePhaseIconClick = () => {
    if (canViewWaiting) {
      onViewChange?.('waiting');
    }
  };

  // Handle exchange icon click
  const handleExchangeIconClick = () => {
    if (canViewExchange) {
      onViewChange?.('exchange');
    }
  };

  const handleAvatarClick = () => {
    setProfileModalOpen(true);
  };  

  const currentUserAssignment = currentMember ? playerAssignments.get(currentMember.id) : undefined;

  return (
    <>
      <Stack 
        justify="space-between" 
        h="100%" 
        p="md"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '80px',
          background: 'white',
          borderRight: '1px solid #eee',
        }}
      >
        {/* Top section */}
        <Stack gap="lg" align="center">
          {/* Current user avatar */}
          {currentUserAssignment && currentMember && (
            <PlayerAvatar
              assignment={currentUserAssignment}
              size="lg"
              highlighted={true}
              highlightColor="green"
              showTooltip={true}
              tooltipLabel={`${currentMember.username || 'You'}`}
              onClick={handleAvatarClick}
            />
          )}

          <Divider style={{ width: '100%' }} />
          
          {/* Phase indicator - clickable in setup phase when appropriate */}
          <Tooltip 
            label={canViewWaiting ? "View waiting status" : `Current phase: ${gamePhase}`} 
            position="right"
          >
            <ActionIcon 
              variant="subtle" 
              size="xl"
              onClick={handlePhaseIconClick}
              style={{ cursor: canViewWaiting ? 'pointer' : 'default' }}
              disabled={!canViewWaiting}
              color={!canViewWaiting ? 'gray' : undefined}
            >
              <PhaseIcon size={24} />
            </ActionIcon>
          </Tooltip>

          {/* Exchange requests with notification badge */}
          <Tooltip label={canViewExchange ? "Exchange requests" : "Exchange not available"} position="right">
            <ActionIcon
              onClick={handleExchangeIconClick}
              variant="subtle"
              size="lg"
              disabled={!canViewExchange}
              color={!canViewExchange ? 'gray' : undefined}
            >
              {hasMatch ? (
                <Indicator label={<IconCheck size={12} />} inline size={16} position="top-end">
                  <IconExchange size={20} />
                </Indicator>
              ) : exchangeUpdatesCount > 0 && canViewExchange ? (
                <Indicator label={exchangeUpdatesCount} inline size={16} position="top-end">
                  <IconExchange size={20} />
                </Indicator>
              ) : (
                <IconExchange size={20} />
              )}
            </ActionIcon>
          </Tooltip>

          {/* Join requests for room creator */}
          {isCreator && (
            <JoinRequests roomId={roomId} />
          )}
          
          {/* Help button */}
          <Tooltip label="Game help" position="right">
            <ActionIcon 
              variant="subtle" 
              size="lg"
              onClick={() => setHelpModalOpen(true)}
            >
              <IconHelp size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>
        
        {/* Bottom section */}
        <Stack gap="md" align="center">
          <Divider style={{ width: '100%' }} />
          
          <Tooltip label="Leave Room" position="right">
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="lg"
              onClick={handleLeaveRoom}
            >
              <IconDoorExit size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Help Modal - Fix HTML hierarchy issue */}
      <Modal
        opened={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title={`${gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)} Phase`}
      >
        <Text>{getHelpText()}</Text>
      </Modal>

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