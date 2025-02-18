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
import { RoomProvider } from '@/context/RoomProvider';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { Setup } from '@/components/game/GamePhases/Setup';
import { Speaking } from '@/components/game/GamePhases/Speaking';
import { PlayerStatus } from '@/components/game/PlayerStatus';
import { SideNavbar } from '@/components/layout/SideNavbar';
import { notifications } from '@mantine/notifications';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { Endgame } from '@/components/game/GamePhases/Endgame';

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
        <Box ta='center'>
          <Loader size="xl" />
          <Text mt="md">Joining room...</Text>
        </Box>
      </Container>
    );
  }

  const isCreator = currentMember.id === room?.created_by;

  return (
    <Box style={{ height: '100vh', position: 'relative' }}>
      {/* Side Navigation */}
      <SideNavbar 
        roomId={roomId}
        isCreator={isCreator}
        gamePhase={phase}
        discardPileCount={cardState.discardPile.length}
        onDiscardPileClick={() => {}}
        handleLeaveRoom={handleLeaveRoom}
      />

      {/* Player Status on right side */}
      <PlayerStatus
        members={members}
        currentUserId={currentMember.id}
        activePlayerId={activePlayerId}
        roomId={roomId}
        gamePhase={phase}
      />

      {/* Main Content */}
      <Box 
        style={{ 
          marginLeft: '60px', // Side navbar width
          marginRight: '80px', // Player status width
          padding: '1rem',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <Paper p="md" radius="xs" style={{ height: '100%' }}>
          {/* Game Phases */}
          {/* Game Phases */}
          {phase === 'setup' ? (
            <Setup />
          ) : phase === 'endgame' ? (
            <Endgame roomId={room?.id}/>
          ) : (
            <Speaking gameStateId={gameStateId} roomId={room?.id} />
          )}
        </Paper>
      </Box>
    </Box>
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
        <Box ta='center'>
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