'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Button,
  Loader,
  Avatar,
  Indicator,
  Tooltip,
} from '@mantine/core';
import {
  IconDoorExit,
  IconHourglass,
  IconSettings,
  IconCards,
  IconMicrophone,
  IconEar,
  IconDog,
  IconCat,
  IconHorse,
  IconBug,
  IconFish,
  IconButterflyFilled,
  IconPaw,
} from '@tabler/icons-react';
import { useRoom } from '@/hooks/room/useRoom';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { useAuth } from '@/context/AuthProvider';
import { GameState } from '@/core/game/types';
import { gameStatesService } from '@/services/supabase/gameStates';
import { GameBoard } from '@/components/game/GameBoard';
import { notifications } from '@mantine/notifications';

/**
 * Simple hash function to pick an avatar icon and color based on a string.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const animalIcons = [
  IconDog,
  IconCat,
  IconHorse,
  IconBug,
  IconFish,
  IconButterflyFilled,
  IconPaw,
];

const avatarColors = [
  'blue',
  'red',
  'green',
  'yellow',
  'orange',
  'violet',
  'pink',
];

/**
 * Returns the Icon component and color based on a player id.
 */
function getAvatarProps(playerId: string) {
  const hash = hashString(playerId);
  const iconIndex = hash % animalIcons.length;
  const colorIndex = hash % avatarColors.length;
  return {
    Icon: animalIcons[iconIndex],
    color: avatarColors[colorIndex],
  };
}

/**
 * A simple wrapper for the status indicator (e.g. green dot).
 * Later you can easily swap out this component for something more dynamic.
 */
interface StatusIndicatorProps {
  showStatus: boolean;
  children: React.ReactNode;
}
const StatusIndicator = ({ showStatus, children }: StatusIndicatorProps) => {
  return showStatus ? (
    <Indicator size={8} color="green" withBorder position="bottom-end">
      {children}
    </Indicator>
  ) : (
    <>{children}</>
  );
};

/**
 * PlayerAvatar: Shows a player's avatar (with tooltip).
 * Highlights the current player and uses the status indicator if the player
 * has completed their action (e.g. selected a card).
 */
interface PlayerAvatarProps {
  player: { id: string; username: string | null; isOnline: boolean; hasSelected?: boolean };
  isCurrent: boolean;
  hasSelected: boolean;
}
const PlayerAvatar = ({ player, isCurrent, hasSelected }: PlayerAvatarProps) => {
  const { Icon, color } = getAvatarProps(player.id);
  // If current player, add a green border.
  const avatarStyle = isCurrent ? { border: '2px solid #28a745' } : undefined;
  const tooltipLabel = player.username ? player.username : player.id.slice(0, 3);
  return (
    <Tooltip label={tooltipLabel}>
      <StatusIndicator showStatus={hasSelected}>
        <Avatar radius="xl" size={32} color={color} style={avatarStyle}>
          <Icon size={18} />
        </Avatar>
      </StatusIndicator>
    </Tooltip>
  );
};

/**
 * RoundIndicator: Displays a series of small circles representing round progress.
 * Filled circles represent completed rounds.
 */
interface RoundIndicatorProps {
  current: number;
  total: number;
}
const RoundIndicator = ({ current, total }: RoundIndicatorProps) => {
  const circles = [];
  for (let i = 1; i <= total; i++) {
    circles.push(
      <Box
        key={i}
        sx={(theme) => ({
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor:
            i <= current ? theme.colors.green[6] : theme.colors.gray[4],
        })}
      />
    );
  }
  return <Box sx={{ display: 'flex', gap: 4 }}>{circles}</Box>;
};

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, loading: roomLoading, error, leaveRoom } = useRoom(roomId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<any>(null);

  // Determine total rounds from room settings (fallback to 3 if not set)
  const roundsTotal = room?.settings?.rounds_per_player || 3;

  // Initialize or join game session.
  useEffect(() => {
    if (!user || !room || sessionId) return;

    async function setupSession() {
      try {
        setLoading(true);
        if (room.current_session_id) {
          const state = await gameStatesService.get(room.current_session_id);
          const existingPlayer = state.players.find((p: any) => p.id === user.id);
          if (!existingPlayer) {
            await gameStatesService.update(room.current_session_id, {
              players: [
                ...state.players,
                {
                  id: user.id,
                  username: user.username || null,
                  isOnline: true,
                  hasSelected: false,
                },
              ],
            });
          }
          setSessionId(room.current_session_id);
          setGameState(state);
        } else {
          const state = await gameStatesService.create({
            activePlayerId: user.id,
            room_id: room.id,
            phase: 'setup',
            round: 1,
            cardsInPlay: [],
            discardPile: [],
            playerHands: {},
            isSpeakerSharing: false,
            pendingExchanges: [],
            players: room.players.map((p: any) => ({
              id: p.id,
              username: p.username,
              isOnline: p.isOnline,
            })),
          });
          setSessionId(state.id);
          setGameState(state);
        }
      } catch (err) {
        console.error('Failed to initialize game state:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to initialize game state',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    }
    setupSession();
  }, [user, room, sessionId]);

  // subscribe to changes
  useEffect(() => {
    if (!sessionId) return;
  
    // Subscribe to changes in the game state.
    const subscription = gameStatesService.subscribeToChanges(sessionId, (newState: GameState) => {
      setGameState(newState);
    });
  
    // Cleanup: Unsubscribe when the component unmounts or sessionId changes.
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      } else if (subscription) {
        // For some Supabase versions, you might need to use:
        supabase.removeChannel(subscription);
      }
    };
  }, [sessionId]);
  
  
  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red',
      });
      router.push('/');
    }
  }, [error, router]);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom();
      router.push('/');
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to leave room',
        color: 'red',
      });
    }
  };

  if (roomLoading || loading) {
    return (
      <Container py="xl">
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Loader size={40} />
          <div>Setting up game session...</div>
        </Box>
      </Container>
    );
  }

  if (!room || !user) {
    return (
      <Container py="xl">
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div>Room not found</div>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </Box>
      </Container>
    );
  }

  const isCreator = room.created_by === user.id;

  // For convenience, derive the players from the game state.
  // For the setup phase, split them into "done" (hasSelected) and "pending".
  const donePlayers =
    gameState?.phase === 'setup'
      ? gameState.players.filter((p: any) => p.hasSelected)
      : [];
  const pendingPlayers =
    gameState?.phase === 'setup'
      ? gameState.players.filter((p: any) => !p.hasSelected)
      : [];

  return (
    <Container py="xl">
      {/* Top horizontal bar */}
      <Box
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          padding: '8px 0',
          marginBottom: '16px',
        }}
      >
        {/* Left side: Discard pile and game progress */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Clickable Discard Pile Icon */}
          <Box
            onClick={() =>
              console.log(
                `Discard Pile has ${gameState.discardPile?.length || 0} cards`
              )
            }
            style={{ cursor: 'pointer' }}
          >
            <Indicator label={gameState.discardPile?.length || 0} size={12} color="blue">
              <IconCards size={20} />
            </Indicator>
          </Box>
          {/* Game Progress: different layouts depending on phase */}
          {gameState && gameState.phase === 'setup' ? (
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Left: Players done */}
              <Box style={{ display: 'flex', gap: '4px' }}>
                {donePlayers.map((p: any) => (
                  <PlayerAvatar
                    key={p.id}
                    player={p}
                    isCurrent={p.id === user.id}
                    hasSelected={true}
                  />
                ))}
              </Box>
              {/* Center: Setup phase icon with round indicator */}
              <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Tooltip label="Setup Phase">
                  <IconHourglass size={20} />
                </Tooltip>
                <RoundIndicator
                  current={gameState.round}
                  total={roundsTotal}
                />
              </Box>
              {/* Right: Players still pending */}
              <Box style={{ display: 'flex', gap: '4px' }}>
                {pendingPlayers.map((p: any) => (
                  <PlayerAvatar
                    key={p.id}
                    player={p}
                    isCurrent={p.id === user.id}
                    hasSelected={false}
                  />
                ))}
              </Box>
            </Box>
          ) : (
            // For speaking/listening phases: show all players then phase icon and round indicator.
            <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box style={{ display: 'flex', gap: '4px' }}>
                {gameState.players.map((p: any) => (
                  <PlayerAvatar
                    key={p.id}
                    player={p}
                    isCurrent={p.id === user.id}
                    hasSelected={!!p.hasSelected}
                  />
                ))}
              </Box>
              <Tooltip
                label={
                  gameState.phase === 'speaking'
                    ? 'Speaking Phase'
                    : 'Listening Phase'
                }
              >
                {gameState.phase === 'speaking' ? (
                  <IconMicrophone size={20} />
                ) : (
                  <IconEar size={20} />
                )}
              </Tooltip>
              <RoundIndicator current={gameState.round} total={roundsTotal} />
            </Box>
          )}
        </Box>
        {/* Right side: Settings and exit buttons */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isCreator && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => {
                /* Open settings modal */
              }}
            >
              <IconSettings size={18} />
            </Button>
          )}
          <Button variant="subtle" size="xs" color="red" onClick={handleLeaveRoom}>
            <IconDoorExit size={18} />
          </Button>
        </Box>
      </Box>

      {/* Join Requests for the room creator */}
      {isCreator && (
        <Box style={{ marginBottom: '16px' }}>
          <JoinRequests roomId={room.id} />
        </Box>
      )}

      {/* Main Game Board */}
      {sessionId && <GameBoard room={room} sessionId={sessionId} />}
    </Container>
  );
}
