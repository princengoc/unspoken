// src/app/room/[id]/page.tsx

'use client';
import { use, useEffect, useState, useCallback } from 'react';
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
import { SideNavbar } from '@/components/layout/SideNavbar';
import { notifications } from '@mantine/notifications';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { Endgame } from '@/components/game/GamePhases/Endgame';

type SetupViewType = 'cards' | 'exchange' | 'waiting';

interface RoomPageContentProps {
  roomId: string;
  gameStateId: string;
}

function RoomPageContent({ roomId, gameStateId }: RoomPageContentProps) {
  const router = useRouter();
  const { phase, activePlayerId } = useGameState();
  const { cardState } = useCardsInGame();
  const { members, currentMember } = useRoomMembers();
  const { room, leaveRoom } = useRoomHook(roomId);
  const [currentSetupView, setCurrentSetupView] = useState<SetupViewType>('cards');

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

  // Use memoized callback to prevent unnecessary renders
  const handleViewChange = useCallback((view: SetupViewType) => {
    setCurrentSetupView(view);
  }, []);

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
        handleLeaveRoom={handleLeaveRoom}
        onViewChange={phase === 'setup' ? handleViewChange : undefined}
      />

      {/* Main Content */}
      <Box 
        style={{ 
          marginLeft: '80px', // Updated sidebar width
          padding: '1rem',
          height: '100%',
          overflowY: 'auto'
        }}
      >
        <Paper p="md" radius="xs" style={{ height: '100%' }}>
          {/* Game Phases */}
          {phase === 'setup' ? (
            <Setup 
              roomId={room?.id} 
              initialView={currentSetupView}
              onViewChange={handleViewChange}
            />
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