// src/components/game/GameBoard.tsx
import { useEffect } from 'react';
import {
  Container,
  Stack,
  Text,
  Button,
  Group,
  Avatar,
  Tooltip,
} from '@mantine/core';
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
  gameStateId: string;
}

export function GameBoard({ room, gameStateId }: GameBoardProps) {
  const { user } = useAuth();

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game...
        </Text>
      </Container>
    );
  }

  return (
    <GameStateProvider players={room.players}>
      <GameBoardContent room={room} gameStateId={gameStateId} />
    </GameStateProvider>
  );
}

function GameBoardContent({ room, gameStateId }: GameBoardProps) {
  const { user } = useAuth();
  const {
    phase,
    playerStatus,
    currentRound,
    totalRounds,
    initializeGame,
    startRound,
    completeRound,
    handleAllPlayersSetupComplete,
  } = useGamePhase(gameStateId);

  const {
    playerHands,
    cardsInPlay,
    discardPile,
    dealInitialCards,
    selectCardForPool,
  } = useCardManagement(gameStateId, user?.id ?? null);

  const {
    activePlayerId,
    canStartSpeaking,
    startSpeaking,
    finishSpeaking,
    currentSpeaker,
  } = useTurnManagement(gameStateId);

  useEffect(() => {
    if (gameStateId) {
      initializeGame();
    }
  }, [gameStateId, initializeGame]);

  if (!user || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game...
        </Text>
      </Container>
    );
  }

  // Render the Setup phase using our new Setup component.
  const renderSetupPhase = () => (
    <Setup
      playerHands={playerHands}
      onDealCards={dealInitialCards}
      onSelectCard={(cardId) => selectCardForPool(user!.id, cardId)}
      onStartGame={room.created_by === user.id ? handleAllPlayersSetupComplete : undefined}
      playerStatus={playerStatus}
      players={room.players}
      discardPile={discardPile}
      isCreator={room.created_by === user.id}
    />
  );

  // Render the Speaking phase.
  // (You can expand this further to handle different UI for the active speaker versus listeners.)
  const renderSpeakingPhase = () => {
    // Example: if the current player is still waiting to speak,
    // show all cards in play along with a "Start Sharing" button if allowed.
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
            <Button onClick={startSpeaking} fullWidth size="lg" variant="filled">
              Start Sharing
            </Button>
          )}
        </Stack>
      );
    }

    // Otherwise, if the player is speaking or listening,
    // show the current speaker’s card and controls.
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
                card={
                  cardsInPlay.find((c) => c.id === currentSpeaker.selectedCard)!
                }
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
              <ListenerReactions
                roomId={gameStateId}
                speakerId={currentSpeaker.id}
                cardId={currentSpeaker.selectedCard!}
              />
            )}
          </>
        )}
      </Stack>
    );
  };

  const renderPhase = () => {
    switch (phase) {
      case 'setup':
        return renderSetupPhase();
      case 'speaking':
        return renderSpeakingPhase();
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
