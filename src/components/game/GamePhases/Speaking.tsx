// src/components/game/GamePhases/Speaking.tsx

import { Stack, Group, Avatar, Button, Text } from '@mantine/core';
import { GameCard } from '../Card';
import { useGameStore } from '@/lib/hooks/useGameStore';
import { useAuth } from '@/context/AuthProvider';

export function Speaking() {
  const { user } = useAuth();
  const { 
    cardsInPlay, 
    activePlayerId,
    isSpeakerSharing,
    setSpeakerSharing,
    setGamePhase 
  } = useGameStore();
  
  const isActiveSpeaker = user?.id === activePlayerId;

  const handleStartSharing = async () => {
    setSpeakerSharing(true);
    await setGamePhase('listening');
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Group>
          <Avatar color="blue" radius="xl">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
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
            total={1}
          />
        )}
      </div>

      {isActiveSpeaker && !isSpeakerSharing && (
        <Button 
          color="blue"
          onClick={handleStartSharing}
          style={{ margin: '0 auto' }}
        >
          Start Sharing
        </Button>
      )}
    </Stack>
  );
}