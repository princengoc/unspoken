// src/app/room/[id]/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Group, Text, Button, Loader, Card } from '@mantine/core';
import { IconDoorExit, IconSettings, IconUsers } from '@tabler/icons-react';
import { useRoom } from '@/lib/hooks/useRoom';
import { useAuth } from '@/context/AuthProvider';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { GameLayout } from '@/components/game/GameLayout';
import { notifications } from '@mantine/notifications';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, loading: roomLoading, error, leaveRoom } = useRoom(roomId);
  const { initSession, sessionId, loading: sessionLoading } = useGameStore();
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Initialize or join game session when room loads
  useEffect(() => {
    if (!user || !room || sessionInitialized) return;

    const setupSession = async () => {
      try {
        // If room has a current session, join it, otherwise create new
        if (room.current_session_id) {
          await initSession(user.id, room.id);
        } else {
          // Create new session as we're the first to join
          const cleanup = await initSession(user.id, room.id);
          if (cleanup) {
            return () => cleanup();
          }
        }
        setSessionInitialized(true);
      } catch (err) {
        console.error('Failed to initialize game session:', err);
        notifications.show({
          title: 'Error',
          message: 'Failed to initialize game session',
          color: 'red'
        });
      }
    };

    setupSession();
  }, [user, room, sessionInitialized, initSession]);

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

  if (roomLoading || sessionLoading) {
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
  const activePlayers = room.players.filter(p => p.is_active);

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

        {/* Game Layout */}
        {sessionInitialized && <GameLayout room={room} />}
      </Stack>
    </Container>
  );
}