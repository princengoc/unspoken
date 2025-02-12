import { Container, Stack, Text, Button, Group, Avatar, Tooltip } from '@mantine/core';
import { IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { Setup } from './GamePhases/Setup';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import type { Player, Room } from '@/core/game/types';
import { ListenerReactions } from './ListenerReactions';
import { Card } from './Card';
import { PLAYER_STATUS } from '@/core/game/constants';

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
}

export function GameBoard({ room }: GameBoardProps) {
  const { 
    phase,
    activePlayerId,
    currentRound,
    totalRounds,
    cardsInPlay
  } = useGameState();

  const {
    members,
    currentMember
  } = useRoomMembers();

  const {
    canStartSpeaking,
    isActiveSpeaker,
    startSpeaking,
    finishSpeaking
  } = useRoom();

  // Find the current speaker from members
  const currentSpeaker = members.find(m => m.id === activePlayerId);

  // --- Render Speaking Phase ---
  const renderSpeakingPhase = () => {
    // If the user is still waiting to speak (i.e. browsing), list all cards in play.
    if (currentMember?.status === PLAYER_STATUS.BROWSING) {
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

    // Otherwise, if the user is speaking or listening, show the current speaker's card and controls.
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
                card={cardsInPlay.find((c) => c.id === currentSpeaker.selectedCard)!}
                index={0}
                total={1}
              />
            )}
            {isActiveSpeaker ? (
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
                speakerId={currentSpeaker.id}
                cardId={currentSpeaker.selectedCard!}
              />
            )}
          </>
        )}
      </Stack>
    );
  };

  if (!currentMember || !room) {
    return (
      <Container size="sm">
        <Text ta="center" c="dimmed">
          Waiting for game...
        </Text>
      </Container>
    );
  }

  return (
    <Container size="sm">
      <Stack gap="xl">
        {/* Player Status Bar */}
        <Group position="apart">
          <Group spacing="xs">
            {members.map((player) => (
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
        {phase === 'setup' ? (
          <Setup />
        ) : (
          renderSpeakingPhase()
        )}
      </Stack>
    </Container>
  );
}