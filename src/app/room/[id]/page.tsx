'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Group,
  Button,
  Loader,
  Avatar,
  Indicator
} from '@mantine/core';
import {
  IconDoorExit,
  IconSettings,
  IconLayoutGrid,
  IconTrash,
  IconReload
} from '@tabler/icons-react';
import { useRoom } from '@/hooks/room/useRoom';
import { useAuth } from '@/context/AuthProvider';
import { gameStatesService } from '@/services/supabase/gameStates';
import { GameBoard } from '@/components/game/GameBoard';
import { notifications } from '@mantine/notifications';

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

  // Initialize or join game session
  useEffect(() => {
    if (!user || !room || sessionId) return;
  
    const setupSession = async () => {
      try {
        setLoading(true);
  
        if (room.current_session_id) {
          // Join existing session
          const state = await gameStatesService.get(room.current_session_id);
  
          // If player already exists in state, just restore their session
          const existingPlayer = state.players.find((p: any) => p.id === user.id);
  
          if (!existingPlayer) {
            // Only add the player if they don't exist
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
          // Create a new game state
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
    };
  
    setupSession();
  }, [user, room, sessionId]);

  // Handle any room errors (unchanged)
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
        <Group direction="column" align="center" spacing="md">
          <Loader size="lg" />
          <div>Setting up game session...</div>
        </Group>
      </Container>
    );
  }

  if (!room || !user) {
    return (
      <Container py="xl">
        <Group direction="column" align="center" spacing="md">
          <div>Room not found</div>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </Group>
      </Container>
    );
  }

  const isCreator = room.created_by === user.id;

  return (
    <Container py="xl">
      {/* Top Bar */}
      <Group position="apart" align="center" mb="md" style={{ width: '100%' }}>
        {/* Left: Player Avatars */}
        <Group spacing="md">
          {room.players.map((p: any) => (
            <Avatar
              key={p.id}
              radius="xl"
              size="lg"
              // Highlight the current user's avatar with a border
              sx={(theme) => ({
                border: p.id === user.id ? `2px solid ${theme.colors.green[6]}` : undefined,
              })}
            >
              {p.username ? p.username.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          ))}
        </Group>

        {/* Middle: Game State Indicators */}
        <Group spacing="md">
          {gameState && (
            <>
              <Indicator label={gameState.cardsInPlay?.length || 0} size={20} color="blue">
                <IconLayoutGrid size={24} />
              </Indicator>
              <Indicator label={gameState.discardPile?.length || 0} size={20} color="red">
                <IconTrash size={24} />
              </Indicator>
              {typeof gameState.round !== 'undefined' && (
                <Indicator label={gameState.round} size={20} color="green">
                  <IconReload size={24} />
                </Indicator>
              )}
            </>
          )}
        </Group>

        {/* Right: Settings & Exit */}
        <Group spacing="md">
          {isCreator && (
            <Button variant="subtle" size="lg" onClick={() => { /* Open settings modal */ }}>
              <IconSettings size={24} />
            </Button>
          )}
          <Button variant="subtle" size="lg" color="red" onClick={handleLeaveRoom}>
            <IconDoorExit size={24} />
          </Button>
        </Group>
      </Group>

      {/* Main Game Board */}
      {sessionId && <GameBoard room={room} sessionId={sessionId} />}
    </Container>
  );
}
