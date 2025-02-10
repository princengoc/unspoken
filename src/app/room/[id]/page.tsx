'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Group, Text, Button, Loader, Card } from '@mantine/core';
import { IconDoorExit, IconSettings, IconUsers } from '@tabler/icons-react';
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

  // Initialize or join game session when room loads
  useEffect(() => {
    if (!user || !room || sessionId) return;

    const setupSession = async () => {
      try {
        setLoading(true);
        
        if (room.current_session_id) {
          // Join existing session
          const gameState = await gameStatesService.get(room.current_session_id);
          
          // Update state with current player if not already present
          const playerExists = gameState.players.some(p => p.id === user.id);
          if (!playerExists) {
            await gameStatesService.update(room.current_session_id, {
              players: [...gameState.players, { 
                id: user.id, 
                username: null, 
                isOnline: true 
              }]
            });
          }
          
          setSessionId(room.current_session_id);
        } else {
          // Create new game state with current room players
          const gameState = await gameStatesService.create({
            activePlayerId: user.id,
            room_id: room.id,
            phase: 'setup',
            cardsInPlay: [],
            discardPile: [],
            playerHands: {},
            isSpeakerSharing: false,
            pendingExchanges: [],
            players: room.players.map(p => ({
              id: p.id,
              username: p.username,
              isOnline: p.isOnline
            }))
          });
          setSessionId(gameState.id);
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
    } catch (error) {
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
        <Card p="xl" withBorder>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Setting up game session...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (!room || !user) {
    return (
      <Container py="xl">
        <Card p="xl" withBorder>
          <Stack align="center" gap="md">
            <Text>Room not found</Text>
            <Button onClick={() => router.push('/')}>Return Home</Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  const isCreator = room.created_by === user.id;
  const activePlayers = room.players.filter(p => p.isOnline);

  return (
    <Container py="xl">
      <Stack gap="lg">
        {/* Room Header */}
        <Card withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>{room.name}</Text>
              <Group>
                {isCreator && (
                  <Button
                    variant="light"
                    leftSection={<IconSettings size={16} />}
                    onClick={() => {/* Open settings modal */}}
                  >
                    Settings
                  </Button>
                )}
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IconDoorExit size={16} />}
                  onClick={handleLeaveRoom}
                >
                  Leave Room
                </Button>
              </Group>
            </Group>

            <Group gap="xs">
              <IconUsers size={16} />
              <Text size="sm" c="dimmed">
                {activePlayers.length} active player{activePlayers.length !== 1 ? 's' : ''}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Game Board */}
        {sessionId && <GameBoard room={room} sessionId={sessionId} />}
      </Stack>
    </Container>
  );
}