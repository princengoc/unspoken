// src/components/game/GameLayout.tsx

'use client';

import { Container, Stack, Paper, Button } from '@mantine/core';
import { Setup } from './GamePhases/Setup';
import { Speaking } from './GamePhases/Speaking';
import { Listening } from './GamePhases/Listening';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useRoom } from '@/lib/hooks/useRoom';
import { useAuth } from '@/context/AuthProvider';

export function GameLayout() {
  const { user } = useAuth();
  const { room } = useRoom();
  const { 
    gamePhase,
    activePlayerId,
    isSpeakerSharing,
    setSpeakerSharing,
    setActivePlayer  // new
  } = useGameStore();

  if (!user || !room) return null;

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
        return null;
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
                  phase: gamePhase,
                  activePlayer: activePlayerId,
                  isSpeakerSharing,
                  currentUser: user.id,
                  playerCount: room.players.length
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