'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Loader,
  Paper,
} from '@mantine/core';
import { IconDoorExit, IconSettings } from '@tabler/icons-react';
import { useRoomHook } from '@/hooks/room/useRoomHook';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { RoomProvider } from '@/context/RoomProvider';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { Setup } from '@/components/game/GamePhases/Setup';
import { Speaking } from '@/components/game/GamePhases/Speaking';
import { PlayerStatusBar } from '@/components/game/PlayerStatus';
import { notifications } from '@mantine/notifications';

function RoundIndicator({ current, total }: { current: number; total: number }) {
  return (
    <Group spacing={4}>
      {Array.from({ length: total }).map((_, i) => (
        <Box
          key={i}
          sx={theme => ({
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: i < current ? theme.colors.blue[6] : theme.colors.gray[3],
          })}
        />
      ))}
    </Group>
  );
}

interface RoomPageContentProps {
  roomId: string;
  gameStateId: string
}

function RoomPageContent({ roomId, gameStateId }: RoomPageContentProps) {
  const router = useRouter();
  const { phase, currentRound, totalRounds, activePlayerId } = useGameState();
  const { members, currentMember } = useRoomMembers();
  const { room, leaveRoom } = useRoomHook(roomId);

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

  if (!currentMember) {
    return (
      <Container size="sm" py="xl">
        <Box sx={{ textAlign: 'center' }}>
          <Loader size="xl" />
          <Text mt="md">Joining room...</Text>
        </Box>
      </Container>
    );
  }

  const isCreator = currentMember.id === room?.created_by;

  return (
    <Container py="xl">
      {/* Top Bar */}
      <Paper p="md" radius="md" withBorder mb="xl">
        <Stack spacing="md">
          {/* Controls */}
          <Group position="apart">
            <Group spacing="xs">
              <PlayerStatusBar 
                members={members} 
                activePlayerId={activePlayerId}
                variant="compact"
                showReadyCount={phase === 'setup'}
              />
              <RoundIndicator current={currentRound} total={totalRounds} />
            </Group>
            <Group spacing="xs">
              {isCreator && (
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => {/* Open settings modal */}}
                >
                  <IconSettings size={18} />
                </Button>
              )}
              <Button
                variant="subtle"
                size="sm"
                color="red"
                onClick={handleLeaveRoom}
              >
                <IconDoorExit size={18} />
              </Button>
            </Group>
          </Group>

          {/* Round Progress */}
          <Group position="apart">
            <Text size="sm" fw={500}>
              Round {currentRound} of {totalRounds}
            </Text>
            <Text size="sm" c="dimmed">
              {phase === 'setup' ? 'Setup Phase' : 'Speaking Phase'}
            </Text>
          </Group>
        </Stack>
      </Paper>

      {/* Join Requests (for room creator) */}
      {isCreator && (
        <Box mb="xl">
          <JoinRequests roomId={roomId} />
        </Box>
      )}

      {/* Game Phases */}
      <Paper p="xl" radius="md" withBorder>
        {phase === 'setup' ? <Setup /> : <Speaking gameStateId={gameStateId} />}
      </Paper>
    </Container>
  );
}

interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);
  const { room, loading, error } = useRoomHook(roomId);
  const router = useRouter();

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

  if (loading || !room || !room?.game_state_id) {
    return (
      <Container py="xl">
        <Box sx={{ textAlign: 'center' }}>
          <Loader size="xl" />
          <Text mt="md">Loading room...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <RoomProvider room={room}>
      <RoomPageContent roomId={roomId} gameStateId={room.game_state_id} />
    </RoomProvider>
  );
}