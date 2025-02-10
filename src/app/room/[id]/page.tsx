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

  // Initialize or join game session when room loads.
  // This logic remains unchanged. Any live updates to gameState are handled elsewhere.
  useEffect(() => {
    if (!user || !room || sessionId) return;

    const setupSession = async () => {
      try {
        setLoading(true);

        if (room.current_session_id) {
          // Join an existing session.
          const state = await gameStatesService.get(room.current_session_id);

          // Ensure the current user is included as a player.
          const playerExists = state.players.some((p: any) => p.id === user.id);
          if (!playerExists) {
            await gameStatesService.update(room.current_session_id, {
              players: [
                ...state.players,
                { id: user.id, username: user.username || null, isOnline: true }
              ]
            });
          }
          setSessionId(room.current_session_id);
          setGameState(state);
        } else {
          // Create a new game state.
          // (Note: The "round" property is added here if available. If not used elsewhere, it will simply not display.)
          const state = await gameStatesService.create({
            activePlayerId: user.id,
            room_id: room.id,
            phase: 'setup',
            round: 1, // Optional: Remove or adjust if your core game state doesn't use this.
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

  // Handle room errors as before.
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
      {/* Slim Top Bar */}
      <Group position="apart" align="center" mb="md">
        {/* Left: Avatars for each room player */}
        <Group spacing="xs">
          {room.players.map((p: any) => (
            <Avatar key={p.id} radius="xl" size="md">
              {p.username ? p.username.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          ))}
        </Group>

        {/* Right: Game state info & control buttons */}
        <Group spacing="xs">
          {gameState && (
            <>
              <Indicator label={gameState.cardsInPlay?.length || 0} size={16} color="blue">
                <IconLayoutGrid size={20} />
              </Indicator>
              <Indicator label={gameState.discardPile?.length || 0} size={16} color="red">
                <IconTrash size={20} />
              </Indicator>
              {typeof gameState.round !== 'undefined' && (
                <Indicator label={gameState.round} size={16} color="green">
                  <IconReload size={20} />
                </Indicator>
              )}
            </>
          )}
          {isCreator && (
            <Button variant="subtle" compact="true" onClick={() => { /* Open settings modal */ }}>
              <IconSettings size={16} />
            </Button>
          )}
          <Button variant="subtle" compact="true" color="red" onClick={handleLeaveRoom}>
            <IconDoorExit size={16} />
          </Button>
        </Group>
      </Group>

      {/* Main Game Board */}
      {sessionId && <GameBoard room={room} sessionId={sessionId} />}
    </Container>
  );
}
