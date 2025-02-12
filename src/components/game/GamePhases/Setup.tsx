// Setup.tsx
import { useState } from 'react';
import { Stack, Text, Group, Button, Paper, Avatar, Transition } from '@mantine/core';
import { IconCheck, IconHourglass } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
import { Card as CardType, PlayerStatus, Player } from '@/core/game/types';
import { CardDeck } from '../CardDeck';
import { Card } from '../Card';
import { FadeIn, SlideIn } from '@/components/animations/Motion';
import { PLAYER_STATUS } from '@/core/game/constants';

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

interface CreatorControlsProps {
  isEveryoneReady: boolean;
  onStartGame: () => void;
  loading: boolean;
}

function CreatorControls({ isEveryoneReady, onStartGame, loading }: CreatorControlsProps) {
  return (
    <Transition mounted={isEveryoneReady} transition="slide-up">
      {(styles) => (
        <Button
          style={styles}
          fullWidth
          size="lg"
          onClick={onStartGame}
          loading={loading}
          leftSection={<IconCheck size={18} />}
        >
          Start Game
        </Button>
      )}
    </Transition>
  );
}

interface SetupProps {
  playerHands: Record<string, CardType[]>;
  onDealCards: () => Promise<void>;
  onSelectCard: (cardId: string) => void;
  onStartGame?: () => Promise<void>; // Triggered by game creator
  playerStatus: PlayerStatus;
  players: Player[];
  discardPile: CardType[];
  isCreator?: boolean;
}

export function Setup({
  playerHands,
  onDealCards,
  onSelectCard,
  onStartGame,
  playerStatus,
  players,
  discardPile,
  isCreator = false,
}: SetupProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  if (!user) return null;

  const userHand = playerHands[user.id] || [];
  const isEveryoneReady = players.every((p) => p.status === PLAYER_STATUS.BROWSING);

  const handleStartGame = async () => {
    if (!onStartGame) return;
    setLoading(true);
    try {
      await onStartGame();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="xl">
      <FadeIn>
        <Group justify="space-between" align="center">
          <Text size="lg" fw={500}>
            Round Setup
          </Text>
          <Text size="sm" c="dimmed">
            {players.filter((p) => p.status === PLAYER_STATUS.BROWSING).length} / {players.length} ready
          </Text>
        </Group>
      </FadeIn>

      {/* Show "Draw Cards" if the player hasn't received any cards */}
      {userHand.length === 0 && playerStatus === PLAYER_STATUS.CHOOSING && (
        <SlideIn>
          <Button onClick={onDealCards} fullWidth size="lg" variant="filled">
            Draw Cards
          </Button>
        </SlideIn>
      )}

      {/* When cards are available: either allow selection or wait */}
      {userHand.length > 0 && playerStatus === PLAYER_STATUS.CHOOSING && (
        <>
          <CardDeck cards={userHand} onSelect={(card) => onSelectCard(card.id)} />
          <SlideIn direction="up">
            <Text size="sm" c="dimmed" ta="center">
              Select one card to share when it&apos;s your turn
            </Text>
          </SlideIn>
        </>
      )}

      {playerStatus === PLAYER_STATUS.BROWSING && (
        <Stack gap="lg">
          <ReadyStatus players={players} totalPlayers={players.length} />

          {isCreator ? (
            <CreatorControls isEveryoneReady={isEveryoneReady} onStartGame={handleStartGame} loading={loading} />
          ) : (
            <Paper p="md" radius="md" withBorder>
              <Group align="center" gap="sm">
                <IconHourglass size={18} />
                <Text size="sm">
                  {isEveryoneReady
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
