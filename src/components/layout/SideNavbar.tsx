import React from 'react';
import { Stack, ActionIcon, Tooltip, Indicator, Divider } from '@mantine/core';
import { IconDoorExit, IconSettings, IconHourglass, IconMessageCircle, IconCards } from '@tabler/icons-react';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { GamePhase } from '@/core/game/types';

interface SideNavbarProps {
  roomId: string;
  isCreator: boolean;
  gamePhase: GamePhase;
  discardPileCount?: number;
  onDiscardPileClick?: () => void;
  handleLeaveRoom?: () => void;
}

export function SideNavbar({
  roomId,
  isCreator,
  gamePhase,
  discardPileCount,
  onDiscardPileClick,
  handleLeaveRoom,
}: SideNavbarProps) {
  const PhaseIcon = gamePhase === 'setup' ? IconHourglass : IconMessageCircle;

  return (
    <Stack 
      justify="space-between" 
      h="100%" 
      p="md"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '60px',
        background: 'white',
        borderRight: '1px solid #eee',
      }}
    >
      {/* Top section */}
      <Stack gap="lg" align="center">
        <ActionIcon variant="subtle" size="xl">
          <PhaseIcon size={24} />
        </ActionIcon>

        {typeof discardPileCount === 'number' && (
          <ActionIcon onClick={onDiscardPileClick} variant="subtle" size="lg">
            <Indicator label={discardPileCount} inline size={16} position="top-end">
              <IconCards size={20} />
            </Indicator>
          </ActionIcon>
        )}

        {isCreator && (
          <>
            <ActionIcon variant="subtle" size="lg">
              <IconSettings size={20} />
            </ActionIcon>

            <JoinRequests roomId={roomId} />
          </>
        )}
        
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
  );
}