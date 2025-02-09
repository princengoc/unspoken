import { Stack, Group, Avatar, Button, Text } from '@mantine/core';
import { IconPlayerPlay } from '@tabler/icons-react';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';

export function Speaking() {
  const { cards, currentCard } = useGameStore();
  
  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Avatar color="blue" radius="xl">Y</Avatar>
          <Text fw={500}>Your turn</Text>
        </Group>
        <Button 
          variant="subtle"
          leftSection={<IconPlayerPlay size={16} />}
          size="sm"
        >
          Play Recording
        </Button>
      </Group>

      <div style={{ position: 'relative' }}>
        <GameCard
          card={cards[currentCard]}
          index={0}
          total={1}
        />
      </div>

      <Button 
        color="blue"
        style={{ margin: '0 auto' }}
      >
        Start Sharing
      </Button>
    </Stack>
  );
}
