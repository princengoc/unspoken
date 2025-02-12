import { Group, Avatar, Indicator, Tooltip } from '@mantine/core';
import { IconMicrophone, IconEar, IconHourglass } from '@tabler/icons-react';
import type { Player } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';

// Simple hash function to generate consistent colors for users
const getPlayerColor = (id: string) => {
  const colors = ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'pink', 'grape'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface PlayerAvatarProps {
  player: Player;
  isActive?: boolean;
  showStatus?: boolean;
}

export function PlayerAvatar({ player, isActive = false, showStatus = true }: PlayerAvatarProps) {
  const getStatusIcon = () => {
    switch (player.status) {
      case PLAYER_STATUS.SPEAKING:
        return <IconMicrophone size={14} />;
      case PLAYER_STATUS.LISTENING:
        return <IconEar size={14} />;
      case PLAYER_STATUS.BROWSING:
        return <IconHourglass size={14} />;
      default:
        return null;
    }
  };

  const avatar = (
    <Avatar
      radius="xl"
      size="md"
      color={getPlayerColor(player.id)}
      sx={theme => ({
        border: isActive ? `2px solid ${theme.colors[getPlayerColor(player.id)][6]}` : undefined,
      })}
    >
      {getStatusIcon() || player.username?.[0].toUpperCase() || 'P'}
    </Avatar>
  );

  const tooltipLabel = `${player.username || 'Player'} - ${player.status}`;

  return showStatus ? (
    <Tooltip label={tooltipLabel}>
      <Indicator
        size={8}
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

interface PlayerStatusBarProps {
  members: Player[];
  activePlayerId: string | null;
}

export function PlayerStatusBar({ members, activePlayerId }: PlayerStatusBarProps) {
  return (
    <Group spacing="xs">
      {members.map((player) => (
        <PlayerAvatar
          key={player.id}
          player={player}
          isActive={player.id === activePlayerId}
        />
      ))}
    </Group>
  );
}