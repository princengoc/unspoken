// src/components/game/GameLayout.tsx
'use client';

import { useEffect } from 'react';
import { Container, Stack, Paper, Button, Text, Loader } from '@mantine/core';
import { Setup } from './GamePhases/Setup';
import { Speaking } from './GamePhases/Speaking';
import { Listening } from './GamePhases/Listening';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useAuth } from '@/context/AuthProvider';
import { Room } from '@/lib/supabase/types';

interface GameLayoutProps {
  room: Room;
}

export function GameLayout({ room }: GameLayoutProps) {
  const { user } = useAuth();
  const { 
    loading, 
    initialized,
    gamePhase,
    activePlayerId,
    isSpeakerSharing,
    setSpeakerSharing,
    setActivePlayer,
    setGamePhase,
    sessionId
  } = useGameStore();

  // Ensure game starts in setup phase for new sessions
  useEffect(() => {
    if (sessionId && gamePhase === null) {
      setGamePhase('setup');
    }
  }, [sessionId, gamePhase, setGamePhase]);

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game session...
        </Text>
      </Container>
    );
  }

  if (!sessionId) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Failed to initialize game session. Please try rejoining the room.
        </Text>
      </Container>
    );
  }  

  if (loading || !initialized) {
    return (
      <Container size="sm">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text ta="center" c="dimmed">
            Setting up game session...
          </Text>
        </Stack>
      </Container>
    );
  }  

  const isActiveSpeaker = user.id === activePlayerId;

  const handleDone = async () => {
    if (isActiveSpeaker) {
      setSpeakerSharing(false);
      // Move to next player's turn
      const currentPlayerIndex = room.players.findIndex(p => p.id === user.id);
      const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
      const nextPlayerId = room.players[nextPlayerIndex].id;
      await setActivePlayer(nextPlayerId);
    }
  };

  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'setup':
        return <Setup />;
      case 'speaking':
        return (
          <Stack gap="lg">
            <Speaking />
            {isActiveSpeaker && isSpeakerSharing && (
              <Button 
                color="blue"
                onClick={handleDone}
                fullWidth
              >
                Done Sharing
              </Button>
            )}
          </Stack>
        );
      case 'listening':
        return <Listening />;
      default:
        return (
          <Text ta="center" c="dimmed">
            Initializing game...
          </Text>
        );
    }
  };

  return (
    <Container size="sm">
      <Stack gap="xl">
        {renderGamePhase()}

        {/* Debug Controls - visible only in development */}
        {process.env.NODE_ENV === 'development' && (
          <Paper 
            shadow="sm" 
            pos="fixed" 
            bottom={0} 
            left={0} 
            right={0} 
            bg="gray.0"
            p="md"
            withBorder
          >
            <pre>
              {JSON.stringify(
                {
                  sessionId,
                  phase: gamePhase,
                  activePlayer: activePlayerId,
                  isSpeakerSharing,
                  currentUser: user.id,
                  playerCount: room.players.length,
                  roomId: room.id
                },
                null,
                2
              )}
            </pre>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}