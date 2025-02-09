// src/app/room/[id]/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Stack, Group, Text, Button, Loader, Card } from '@mantine/core';
import { IconDoorExit, IconSettings, IconUsers } from '@tabler/icons-react';
import { useRoom } from '@/lib/hooks/useRoom';
import { useAuth } from '@/context/AuthProvider';
import { GameLayout } from '@/components/game/GameLayout';
import { notifications } from '@mantine/notifications';

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const { room, loading, error, leaveRoom } = useRoom(roomId);

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

  if (loading) {
    return (
      <Container py="xl">
        <Card p="xl" withBorder>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading room...</Text>
          </Stack>
        </Card>
      </Container>
    );
  }

  if (!room || !user) {
    return null;
  }

  const isCreator = room.created_by === user.id;
  const activePlayers = room.players.filter(p => p.is_active);

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
        <GameLayout />
      </Stack>
    </Container>
  );
}