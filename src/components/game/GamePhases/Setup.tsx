import { Stack, Text, Group, Button, Paper, Avatar, Transition } from '@mantine/core';
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useGameState } from '@/context/GameStateProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useRoom } from '@/context/RoomProvider';
import { CardDeck } from '../CardDeck';
import { Card } from '../Card';
import { FadeIn, SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';
import { Player } from '@/core/game/types';

interface ReadyStatusProps {
  players: Player[];
  totalPlayers: number;
}

function ReadyStatus({ players, totalPlayers }: ReadyStatusProps) {
  const readyPlayers = players.filter(p => p.status === PLAYER_STATUS.BROWSING);
  
  return (
    <Paper p="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Players Ready
          </Text>
          <Text size="sm" c="dimmed">
            {readyPlayers.length}/{totalPlayers}
          </Text>
        </Group>
        <Group>
          {players.map((player) => (
            <Avatar
              key={player.id}
              size="sm"
              radius="xl"
              color={player.status === PLAYER_STATUS.BROWSING ? 'green' : 'gray'}
            >
              {player.username?.[0].toUpperCase() || 'P'}
              {player.status === PLAYER_STATUS.BROWSING && (
                <Avatar.Badge>
                  <IconCheck size={8} />
                </Avatar.Badge>
              )}
            </Avatar>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
}

export function Setup() {
  const { discardPile } = useGameState();
  const { members, currentMember } = useRoomMembers();
  const { 
    handleCardSelection, 
    initiateSpeakingPhase,
    isSetupComplete 
  } = useRoom();

  // Check if current user is the room creator
  const isCreator = currentMember?.id === room.created_by;

  return (
    <Stack gap="xl">
      <FadeIn>
        <Group justify="space-between" align="center">
          <Text size="lg" fw={500}>
            Round Setup
          </Text>
          <Text size="sm" c="dimmed">
            {members.filter((p) => p.status === PLAYER_STATUS.BROWSING).length} / {members.length} ready
          </Text>
        </Group>
      </FadeIn>

      {/* Show "Draw Cards" if the player hasn't received any cards */}
      {currentMember?.playerHand?.length === 0 && currentMember?.status === PLAYER_STATUS.CHOOSING && (
        <SlideIn>
          <Button onClick={dealInitialCards} fullWidth size="lg" variant="filled">
            Draw Cards
          </Button>
        </SlideIn>
      )}

      {/* When cards are available: either allow selection or wait */}
      {currentMember?.playerHand?.length > 0 && currentMember?.status === PLAYER_STATUS.CHOOSING && (
        <>
          <CardDeck cards={currentMember.playerHand} onSelect={handleCardSelection} />
          <SlideIn direction="up">
            <Text size="sm" c="dimmed" ta="center">
              Select one card to share when it&apos;s your turn
            </Text>
          </SlideIn>
        </>
      )}

      {currentMember?.status === PLAYER_STATUS.BROWSING && (
        <Stack gap="lg">
          <ReadyStatus players={members} totalPlayers={members.length} />

          {isCreator ? (
            <Transition mounted={isSetupComplete} transition="slide-up">
              {(styles) => (
                <Button
                  style={styles}
                  fullWidth
                  size="lg"
                  onClick={initiateSpeakingPhase}
                  leftSection={<IconCheck size={18} />}
                >
                  Start Game
                </Button>
              )}
            </Transition>
          ) : (
            <Paper p="md" radius="md" withBorder>
              <Group align="center" gap="sm">
                <IconHourglass size={18} />
                <Text size="sm">
                  {isSetupComplete
                    ? "Everyone's ready! Waiting for the room creator to start the game..."
                    : "Waiting for other players to choose their cards..."}
                </Text>
              </Group>
            </Paper>
          )}

          {discardPile.length > 0 && (
            <>
              <Text size="sm" c="dimmed" ta="center">
                Browse discarded cards while waiting
              </Text>
              <Stack gap="md">
                {discardPile.map((card, index) => (
                  <Card key={card.id} card={card} index={index} total={discardPile.length} showExchange />
                ))}
              </Stack>
            </>
          )}
        </Stack>
      )}
    </Stack>
  );
}