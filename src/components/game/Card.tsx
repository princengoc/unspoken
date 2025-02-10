import { Card as MantineCard, Group, Text, Button, Avatar, Tooltip, Badge, Stack } from '@mantine/core';
import { IconShare2, IconCheck } from '@tabler/icons-react';
import type { Card as CardType } from '@/core/game/types';

interface GameCardProps {
  card: CardType;
  index: number;
  total: number;
  showExchange?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onExchange?: () => void;
}

export function GameCard({ 
  card, 
  index, 
  total, 
  showExchange = false,
  selected = false,
  onSelect,
  onExchange
}: GameCardProps) {
  const isSelectable = !!onSelect;
  
  return (
    <MantineCard 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      style={{
        cursor: isSelectable ? 'pointer' : 'default',
        border: selected ? '2px solid blue' : undefined,
        width: '320px',
        maxWidth: '90vw'
      }}
      onClick={isSelectable ? onSelect : undefined}
    >
      <Stack gap="lg">
        {/* Card Header */}
        <Group justify="space-between">
          <Badge variant="light" size="lg">
            {index + 1}/{total}
          </Badge>
          {showExchange && onExchange && (
            <Tooltip label="Exchange this card">
              <Button 
                variant="subtle" 
                size="sm"
                leftSection={<IconShare2 size={16} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onExchange();
                }}
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

        {/* Card Content */}
        <Text size="lg" fw={500} ta="center" py="xl">
          {card.content}
        </Text>

        {/* Card Footer */}
        <Group justify="flex-start" gap="sm">
          <Avatar 
            size="sm" 
            radius="xl"
            color="blue"
          >
            {card.contributor_id?.charAt(0).toUpperCase() || '?'}
          </Avatar>
          <Text size="sm" c="dimmed">
            {card.contributor_id || 'Anonymous'}
          </Text>
        </Group>
      </Stack>
    </MantineCard>
  );
}

// Export the component
export { GameCard as Card };