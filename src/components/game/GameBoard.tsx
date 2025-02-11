// src/components/game/GameBoard.tsx
import { useEffect } from 'react';
import { Container, Stack, Text, Button, Group, Avatar, Tooltip } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { Setup } from './GamePhases/Setup';
import { useGamePhase } from '@/hooks/game/useGamePhase';
import { useCardManagement } from '@/hooks/game/useCardManagement';
import { useTurnManagement } from '@/hooks/game/useTurnManagement';
import { useAuth } from '@/context/AuthProvider';
import { Room, Player } from '@/core/game/types';
import { GameStateProvider } from '@/context/GameStateProvider';
import { PLAYER_STATUS } from '@/core/game/constants';
import { ListenerReactions } from './ListenerReactions';
import { Card } from './Card';

interface PlayerStatusProps {
  player: Player;
  isActive: boolean;
}

function PlayerStatus({ player, isActive }: PlayerStatusProps) {
  let statusColor = 'gray';
  let statusIcon = null;

  switch (player.status) {
    case PLAYER_STATUS.SPEAKING:
      statusColor = 'green';
      statusIcon = <IconPlayerPlay size={14} />;
      break;
    case PLAYER_STATUS.LISTENING:
      statusColor = 'blue';
      statusIcon = <IconPlayerPause size={14} />;
      break;
  }

  return (
    <Tooltip label={`${player.username || 'Player'} - ${player.status}`}>
      <Avatar
        radius="xl"
        size="md"
        color={isActive ? statusColor : 'gray'}
        sx={{ border: isActive ? '2px solid currentColor' : undefined }}
      >
        {statusIcon || player.username?.[0].toUpperCase() || 'P'}
      </Avatar>
    </Tooltip>
  );
}

interface GameBoardProps {
  room: Room;
  sessionId: string;
}

export function GameBoard({ room, sessionId }: GameBoardProps) {
  const { user } = useAuth();

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game session...
        </Text>
      </Container>
    );
  }

  return (
    <GameStateProvider players={room.players}>
      <GameBoardContent room={room} sessionId={sessionId} />
    </GameStateProvider>
  );
}

function GameBoardContent({ room, sessionId }: GameBoardProps) {
  const { user } = useAuth();
  const { 
    phase,
    playerStatus,
    currentRound,
    totalRounds,
    isSetupComplete,
    initializeGame,
    startGame 
  } = useGamePhase(sessionId);

  const { 
    playerHands, 
    cardsInPlay, 
    discardPile,
    selectedCards, 
    loading: cardsLoading, 
    dealInitialCards,
    selectCardForPool
  } = useCardManagement(sessionId, user?.id ?? null);

  const {
    activePlayerId,
    isActiveSpeaker,
    currentSpeaker,
    speakingOrder,
    canStartSpeaking,
    startSpeaking,
    finishSpeaking
  } = useTurnManagement(sessionId);

  useEffect(() => {
    if (sessionId) {
      initializeGame();
    }
  }, [sessionId, initializeGame]);

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game session...
        </Text>
      </Container>
    );
  }

  const renderPhase = () => {
    switch (phase) {
      case 'setup':
        return (
          <Setup
            playerHands={playerHands}
            selectedCards={selectedCards}
            discardPile={discardPile}
            onDealCards={dealInitialCards}
            onSelectCard={(cardId) => selectCardForPool(user.id, cardId)}
            playerStatus={playerStatus}
            sessionId={sessionId}
          />
        );

      case 'speaking':
        if (playerStatus === PLAYER_STATUS.BROWSING) {
          return (
            <Stack gap="lg">
              {cardsInPlay.map((card, index) => (
                <Card
                  key={card.id}
                  card={card}
                  index={index}
                  total={cardsInPlay.length}
                  showExchange={false}
                />
              ))}
              {canStartSpeaking && (
                <Button
                  onClick={startSpeaking}
                  fullWidth
                  size="lg"
                  variant="filled"
                >
                  Start Sharing
                </Button>
              )}
            </Stack>
          );
        }

        return (
          <Stack gap="lg">
            {currentSpeaker && (
              <>
                <Group position="apart">
                  <PlayerStatus player={currentSpeaker} isActive={true} />
                  <Text size="sm" c="dimmed">
                    Round {currentRound} of {totalRounds}
                  </Text>
                </Group>

                {currentSpeaker.selectedCard && (
                  <Card
                    card={cardsInPlay.find(c => c.id === currentSpeaker.selectedCard)!}
                    index={0}
                    total={1}
                  />
                )}

                {playerStatus === PLAYER_STATUS.SPEAKING ? (
                  <Button
                    onClick={finishSpeaking}
                    fullWidth
                    size="lg"
                    variant="filled"
                    color="green"
                  >
                    Finish Sharing
                  </Button>
                ) : (
                  <ListenerReactions sessionId={sessionId} />
                )}
              </>
            )}
          </Stack>
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
        {/* Player Status Bar */}
        <Group position="apart">
          <Group spacing="xs">
            {room.players.map((player) => (
              <PlayerStatus
                key={player.id}
                player={player}
                isActive={player.id === activePlayerId}
              />
            ))}
          </Group>
          <Text size="sm" fw={500}>
            Round {currentRound}/{totalRounds}
          </Text>
        </Group>

        {/* Main Game Area */}
        {renderPhase()}
      </Stack>
    </Container>
  );
}