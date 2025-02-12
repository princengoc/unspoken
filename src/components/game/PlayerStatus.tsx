// PlayerStatus.tsx
import { Group, Avatar, Indicator, Tooltip, Text, Paper, Stack } from '@mantine/core';
import { IconMicrophone, IconEar, IconHourglass, IconCheck } from '@tabler/icons-react';
import type { Player } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';

const getPlayerColor = (id: string) => {
  const colors = ['blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'pink', 'grape'];
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

interface PlayerAvatarProps {
  player: Player;
  isActive?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showReadyBadge?: boolean;
}

export function PlayerAvatar({ 
  player, 
  isActive = false, 
  showStatus = true,
  size = 'md',
  showReadyBadge = false
}: PlayerAvatarProps) {
  const getStatusIcon = () => {
    switch (player.status) {
      case PLAYER_STATUS.SPEAKING:
        return <IconMicrophone size={size === 'sm' ? 12 : 14} />;
      case PLAYER_STATUS.LISTENING:
        return <IconEar size={size === 'sm' ? 12 : 14} />;
      case PLAYER_STATUS.BROWSING:
        return <IconHourglass size={size === 'sm' ? 12 : 14} />;
      default:
        return null;
    }
  };

  const avatar = (
    <Avatar
      radius="xl"
      size={size}
      color={getPlayerColor(player.id)}
      sx={theme => ({
        border: isActive ? `2px solid ${theme.colors[getPlayerColor(player.id)][6]}` : undefined,
      })}
    >
      {getStatusIcon() || player.username?.[0].toUpperCase() || 'P'}
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

interface PlayerStatusBarProps {
  members: Player[];
  activePlayerId: string | null;
  variant?: 'compact' | 'full' | 'ready';
  showReadyCount?: boolean;
}

export function PlayerStatusBar({ 
  members, 
  activePlayerId,
  variant = 'compact',
  showReadyCount = false
}: PlayerStatusBarProps) {
  const readyPlayers = members.filter(p => p.status === PLAYER_STATUS.BROWSING);

  if (variant === 'ready') {
    return (
      <Paper p="md" radius="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              Players Ready
            </Text>
            <Text size="sm" c="dimmed">
              {readyPlayers.length}/{members.length}
            </Text>
          </Group>
          <Group>
            {members.map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                size="sm"
                showReadyBadge
              />
            ))}
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Group spacing="xs" align="center">
      {members.map((player) => (
        <PlayerAvatar
          key={player.id}
          player={player}
          isActive={player.id === activePlayerId}
          size={variant === 'compact' ? 'sm' : 'md'}
        />
      ))}
      {showReadyCount && (
        <Text size="sm" c="dimmed" ml="xs">
          {readyPlayers.length}/{members.length} ready
        </Text>
      )}
    </Group>
  );
}