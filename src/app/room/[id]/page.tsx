'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Button, Loader, Avatar, Indicator } from '@mantine/core';
import {
  IconDoorExit,
  IconSettings,
  IconCards,
  IconReload,
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
import { gameStatesService } from '@/services/supabase/gameStates';
import { GameBoard } from '@/components/game/GameBoard';
import { notifications } from '@mantine/notifications';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

// ----- Simple Hash Function & Avatar Selection -----
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
  IconPaw
];

const avatarColors = [
  'blue',
  'red',
  'green',
  'yellow',
  'orange',
  'violet',
  'pink'
];

function getAvatarProps(playerId: string) {
  const hash = hashString(playerId);
  const iconIndex = hash % animalIcons.length;
  const colorIndex = hash % avatarColors.length;
  return {
    Icon: animalIcons[iconIndex],
    color: avatarColors[colorIndex]
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, loading: roomLoading, error, leaveRoom } = useRoom(roomId);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<any>(null);

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
                { id: user.id, username: user.username || null, isOnline: true, hasSelected: false }
              ]
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
              isOnline: p.isOnline
            }))
          });
          setSessionId(state.id);
          setGameState(state);
        }
      } catch (err) {
        console.error('Failed to initialize game state:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to initialize game state',
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
    }
    setupSession();
  }, [user, room, sessionId]);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
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
        color: 'red'
      });
    }
  };

  if (roomLoading || loading) {
    return (
      <Container py="xl">
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Loader size={40} />
          <div>Setting up game session...</div>
        </Box>
      </Container>
    );
  }

  if (!room || !user) {
    return (
      <Container py="xl">
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div>Room not found</div>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </Box>
      </Container>
    );
  }

  const isCreator = room.created_by === user.id;

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
          marginBottom: '16px'
        }}
      >
        {/* Left side: Avatars and game status */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatars */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {room.players.map((p: any) => {
              const { Icon, color } = getAvatarProps(p.id);
              return (
                <Avatar
                  key={p.id}
                  radius="xl"
                  size={32}
                  color={color}
                  // Using standard "style" instead of sx
                  style={{
                    border: p.id === user.id ? '2px solid #28a745' : undefined
                  }}
                >
                  <Icon size={18} />
                </Avatar>
              );
            })}
          </Box>
          {/* Game status indicators */}
          <Box style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {gameState && (
              <>
                <Indicator label={gameState.discardPile?.length || 0} size={12} color="blue">
                  <IconCards size={20} />
                </Indicator>
                  <Indicator label={gameState.round} size={16} color="green">
                    Round {gameState.round} of 3
                  </Indicator>
              </>
            )}
          </Box>
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
