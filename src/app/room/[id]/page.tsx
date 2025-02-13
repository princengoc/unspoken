'use client';
import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Text,
  Loader,
  Paper,
} from '@mantine/core';
import { useRoomHook } from '@/hooks/room/useRoomHook';
import { JoinRequests } from '@/hooks/room/JoinRequests';
import { RoomProvider } from '@/context/RoomProvider';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { Setup } from '@/components/game/GamePhases/Setup';
import { Speaking } from '@/components/game/GamePhases/Speaking';
import { PlayerStatusBar } from '@/components/game/PlayerStatus';
import { notifications } from '@mantine/notifications';
import { useCardsInGame } from '@/context/CardsInGameProvider';

interface RoomPageContentProps {
  roomId: string;
  gameStateId: string
}

function RoomPageContent({ roomId, gameStateId }: RoomPageContentProps) {
  const router = useRouter();
  const { phase, activePlayerId } = useGameState();
  const { cardState } = useCardsInGame();
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
      <Paper p="md" radius="md" withBorder mb="xl" w = "100%">
              <PlayerStatusBar 
                members={members} 
                currentUserId={currentMember.id}
                roomId={roomId}
                gamePhase={phase}
                discardPileCount={cardState.discardPile.length}
                isCreator={isCreator}
                handleLeaveRoom={handleLeaveRoom}
              />
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