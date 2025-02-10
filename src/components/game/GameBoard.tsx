import { useEffect } from 'react';
import { Container, Stack, Paper, Button, Text, Loader } from '@mantine/core';
import { Setup } from './GamePhases/Setup';
import { Speaking } from './GamePhases/Speaking';
import { Listening } from './GamePhases/Listening';
import { useGamePhase } from '@/hooks/game/useGamePhase';
import { useCardManagement } from '@/hooks/game/useCardManagement';
import { useTurnManagement } from '@/hooks/game/useTurnManagement';
import { useAuth } from '@/context/AuthProvider';
import { Room } from '@/core/game/types';

interface GameBoardProps {
  room: Room;
  sessionId: string;
}

export function GameBoard({ room, sessionId }: GameBoardProps) {
  const { user } = useAuth();
  const { phase, startGame } = useGamePhase(sessionId, room.players);
  const { 
    playerHands, 
    cardsInPlay, 
    selectedCards, 
    loading: cardsLoading, 
    dealInitialCards,
    selectCardForPool,
    addWildCards 
  } = useCardManagement(sessionId, user?.id ?? null);
  const { 
    activePlayerId, 
    isSpeakerSharing, 
    isActiveSpeaker, 
    startSharing, 
    endSharing 
  } = useTurnManagement(sessionId, room.players);

  useEffect(() => {
    if (sessionId && phase === null) {
      startGame();
    }
  }, [sessionId, phase, startGame]);

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game session...
        </Text>
      </Container>
    );
  }

  if (cardsLoading) {
    return (
      <Container size="sm">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text ta="center" c="dimmed">
            Setting up game...
          </Text>
        </Stack>
      </Container>
    );
  }

  const handleDone = async () => {
    if (isActiveSpeaker(user.id)) {
      await endSharing();
    }
  };

  const renderGamePhase = () => {
    switch (phase) {
      case 'setup':
        return (
          <Setup
            playerHands={playerHands}
            selectedCards={selectedCards}
            onDealCards={dealInitialCards}
            onSelectCard={selectCardForPool}
            onAddWildCards={addWildCards}
            onStartGame={startGame}
          />
        );
      case 'speaking':
        return (
          <Stack gap="lg">
            <Speaking
              cardsInPlay={cardsInPlay}
              isActiveSpeaker={isActiveSpeaker(user.id)}
              onStartSharing={startSharing}
            />
            {isActiveSpeaker(user.id) && isSpeakerSharing && (
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
        return (
          <Listening
            cardsInPlay={cardsInPlay}
            isSpeakerSharing={isSpeakerSharing}
          />
        );
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
                  phase,
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