'use client';

import { Card, Group, Text, Button, Avatar, Tooltip, Badge, Stack } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { useGameStore } from '@/lib/hooks/useGameStore';
import type { Card as CardType } from '@/lib/supabase/types';

interface GameCardProps {
  card: CardType;
  index: number;
  total: number;
  showExchange?: boolean;
}

export function GameCard({ card, index, total, showExchange = false }: GameCardProps) {
  const gamePhase = useGameStore(state => state.gamePhase);
  
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Badge variant="light" size="lg">
            {index + 1}/{total}
          </Badge>
          {showExchange && (
            <Tooltip label="Exchange this card">
              <Button 
                variant="subtle" 
                size="sm"
                leftSection={<IconShare2 size={16} />}
                onClick={() => {/* Exchange logic */}}
              >
                Exchange
              </Button>
            </Tooltip>
          )}
        </Group>

        <Text size="lg" fw={500} ta="center" py="xl">
          {card.text}
        </Text>

        <Group justify="flex-start" gap="sm">
          <Avatar 
            size="sm" 
            radius="xl"
            color="blue"
          >
            {card.contributor_id?.toUpperCase()}
          </Avatar>
          <Text size="sm" c="dimmed">{card.contributor_id}</Text>
        </Group>
      </Stack>
    </Card>
  );
}