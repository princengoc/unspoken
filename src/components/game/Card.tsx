// Enhanced Card.tsx
'use client';

import { Card, Group, Text, Button, Avatar, Tooltip, Badge, Stack } from '@mantine/core';
import { IconShare2, IconCheck } from '@tabler/icons-react';
import { useGameStore } from '@/lib/hooks/useGameStore';
import type { Card as CardType } from '@/lib/supabase/types';

interface GameCardProps {
  card: CardType;
  index: number;
  total: number;
  showExchange?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function GameCard({ 
  card, 
  index, 
  total, 
  showExchange = false,
  selected = false,
  onSelect
}: GameCardProps) {
  const gamePhase = useGameStore(state => state.gamePhase);
  const gameStage = useGameStore(state => state.gameStage);
  
  const isSelectable = gamePhase === 'setup' && gameStage === 'selecting' && onSelect;
  
  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{
        cursor: isSelectable ? 'pointer' : 'default',
        border: selected ? '2px solid blue' : undefined
      }}
      onClick={isSelectable ? onSelect : undefined}
    >
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
              >
                Exchange
              </Button>
            </Tooltip>
          )}
          {selected && (
            <Badge color="blue" leftSection={<IconCheck size={14} />}>
              Selected
            </Badge>
          )}
        </Group>

        <Text size="lg" fw={500} ta="center" py="xl">
          {card.content}
        </Text>

        <Group justify="flex-start" gap="sm">
          <Avatar 
            size="sm" 
            radius="xl"
            color="blue"
          >
            {card.contributor_id?.charAt(0).toUpperCase()}
          </Avatar>
          <Text size="sm" c="dimmed">{card.contributor_id}</Text>
        </Group>
      </Stack>
    </Card>
  );
}