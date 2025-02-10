'use client';
import { use, useState } from 'react';
import { Box, Container, ActionIcon, Group, Text, Stack } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IconDoorExit, IconSettings, IconUsers, IconMenu2 } from '@tabler/icons-react';
import { useRoom } from '@/hooks/room/useRoom';
import { useAuth } from '@/context/AuthProvider';
import { GameBoard } from '@/components/game/GameBoard';
import { notifications } from '@mantine/notifications';
import BottomSheet from '@/components/layout/BottomSheet';

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { room, loading, error, leaveRoom } = useRoom(roomId);
  const [showMenu, setShowMenu] = useState(false);

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

  if (loading || !room || !user) {
    return null; // Or a loading spinner
  }

  const activePlayers = room.players.filter(p => p.isOnline);
  const isCreator = room.created_by === user.id;

  return (
    <Box style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Main Content Area */}
      <Box style={{ flex: 1, overflow: 'auto' }}>
        <GameBoard room={room} sessionId={room.current_session_id || ''} />
      </Box>

      {/* Bottom Navigation */}
      <Box 
        py="xs" 
        px="md" 
        bg="var(--mantine-color-body)"
        style={{ 
          borderTop: '1px solid var(--mantine-color-gray-2)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Group justify="space-between">
          {/* Left side - Room info */}
          <Group gap="sm">
            <ActionIcon variant="subtle" size="lg" color="blue">
              <IconUsers size={20} />
            </ActionIcon>
            <Text size="sm">{activePlayers.length} online</Text>
          </Group>

          {/* Right side - Actions */}
          <Group gap="xs">
            {isCreator && (
              <ActionIcon 
                variant="subtle" 
                color="blue" 
                size="lg"
                onClick={() => setShowMenu(true)}
              >
                <IconSettings size={20} />
              </ActionIcon>
            )}
            <ActionIcon 
              variant="subtle" 
              color="red" 
              size="lg"
              onClick={handleLeaveRoom}
            >
              <IconDoorExit size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      {/* Settings Menu (for room creator) */}
      <BottomSheet
        opened={showMenu}
        onClose={() => setShowMenu(false)}
      >
        <Stack>
          <Text size="lg" fw={500}>Room Settings</Text>
          {/* Add room settings controls here */}
        </Stack>
      </BottomSheet>
    </Box>
  );
}