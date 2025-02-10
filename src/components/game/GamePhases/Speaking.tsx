import { Stack, Group, Avatar, Button, Text } from '@mantine/core';
import { GameCard } from '../Card';
import { useAuth } from '@/context/AuthProvider';
import { Card } from '@/core/game/types';

interface SpeakingProps {
  cardsInPlay: Card[];
  isActiveSpeaker: boolean;
  onStartSharing: () => void;
}

export function Speaking({ 
  cardsInPlay, 
  isActiveSpeaker,
  onStartSharing 
}: SpeakingProps) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Avatar color="blue" radius="xl">
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Text fw={500}>
            {isActiveSpeaker ? 'Your turn' : 'Waiting for speaker...'}
          </Text>
        </Group>
      </Group>

      <div style={{ position: 'relative' }}>
        {cardsInPlay[0] && (
          <GameCard
            card={cardsInPlay[0]}
            index={0}
            total={cardsInPlay.length}
          />
        )}
      </div>

      {isActiveSpeaker && (
        <Button 
          color="blue"
          onClick={onStartSharing}
          style={{ margin: '0 auto' }}
        >
          Start Sharing
        </Button>
      )}
    </Stack>
  );
}