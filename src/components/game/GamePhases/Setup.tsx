import React, { useState } from 'react';
import { Stack, Button, Text, Group, Paper, Title, Avatar, RingProgress, Box, Container } from '@mantine/core';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/core/game/types';
import { useGameState } from '@/context/GameStateProvider';
import { CardDeck } from '../CardDeck';
import { IconUsers } from '@tabler/icons-react';
import BottomSheet from '@/components/layout/BottomSheet';

interface SetupProps {
  playerHands: Record<string, Card[]>;
  selectedCards: Record<string, string>;
  onDealCards: () => Promise<void>;
  onSelectCard: (playerId: string, cardId: string) => void;
  onAddWildCards: () => Promise<void>;
  onStartGame: () => void;
}

export function Setup({ playerHands, selectedCards, onDealCards, onSelectCard, onAddWildCards, onStartGame }: SetupProps) {
  const { user } = useAuth();
  const [showPlayerSheet, setShowPlayerSheet] = useState(false);
  
  if (!user) return null;

  const stateMachine = useGameState();
  const userHand = playerHands[user.id] || [];
  const hasSelected = !!selectedCards[user.id];
  const allPlayersSelected = Object.keys(playerHands).length > 0 && stateMachine.areAllPlayersSelected();
  
  const players = stateMachine.getState().players;
  const selectedCount = Object.keys(selectedCards).length;
  const progress = (selectedCount / players.length) * 100;

  return (
    <Stack gap="xs" px="md">
      <Title order={3} size="h4" ta="center">Game Setup</Title>
      
      {!userHand.length ? (
        <Text size="sm" ta="center" c="dimmed">Start by dealing cards</Text>
      ) : !hasSelected ? (
        <Text size="sm" ta="center" c="dimmed">Choose a card</Text>
      ) : !allPlayersSelected ? (
        <Text size="sm" ta="center" c="dimmed">Waiting for players...</Text>
      ) : null}

      {!userHand.length ? (
        <Button onClick={onDealCards} size="md" fullWidth>Deal Cards</Button>
      ) : !hasSelected ? (
        <>
          <Box pos="relative">
            <CardDeck cards={userHand} onSelect={(card) => onSelectCard(user.id, card.id)} />
            <Box pos="absolute" bottom={8} right={8}>
              <Button size="xs" variant="filled" radius="xl" onClick={() => setShowPlayerSheet(true)}>
                <IconUsers size={14} /> {selectedCount}/{players.length}
              </Button>
            </Box>
          </Box>
          <BottomSheet opened={showPlayerSheet} onClose={() => setShowPlayerSheet(false)}>
            <Paper p="xs" radius="md" withBorder>
              <Group justify="space-between">
                <Group><IconUsers size={18} /><Text size="xs">Players</Text></Group>
                <RingProgress size={28} thickness={3} sections={[{ value: progress, color: 'blue' }]} />
              </Group>
              <Group gap="xs">
                {players.map((player) => (
                  <Avatar key={player.id} size="xs" radius="xl" color={selectedCards[player.id] ? 'blue' : 'gray'}>
                    {player.id === user.id ? 'You' : 'P'}
                  </Avatar>
                ))}
              </Group>
            </Paper>
          </BottomSheet>
        </>
      ) : allPlayersSelected ? (
        <Button onClick={onStartGame} size="md" fullWidth>Start Game</Button>
      ) : null}
    </Stack>
  );
}
