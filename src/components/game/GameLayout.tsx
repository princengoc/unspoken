'use client';

import { Container, Title, SegmentedControl, Group, Switch, Stack, Paper } from '@mantine/core';
import { Setup, Speaking, Listening } from './GamePhases';
import { useGameStore } from '@/lib/hooks/useGameStore';

export function GameLayout() {
  const { 
    gamePhase, 
    setGamePhase,
    isSpeakerSharing,
    setSpeakerSharing 
  } = useGameStore();

  const renderGamePhase = () => {
    switch (gamePhase) {
      case 'setup':
        return <Setup />;
      case 'speaking':
        return <Speaking />;
      case 'listening':
        return <Listening />;
      default:
        return null;
    }
  };

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Title order={2} c="blue">Deeper</Title>
        
        {renderGamePhase()}

        {/* Debug Controls */}
        <Paper 
          shadow="sm" 
          pos="fixed" 
          bottom={0} 
          left={0} 
          right={0} 
          bg="gray.0"
          p="md"
          withBorder
        >
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={6}>Game Phase</Title>
              <SegmentedControl
                value={gamePhase}
                onChange={setGamePhase}
                data={[
                  { label: 'Setup', value: 'setup' },
                  { label: 'Speaking', value: 'speaking' },
                  { label: 'Listening', value: 'listening' },
                ]}
              />
            </Group>
            
            <Group justify="space-between" align="center">
              <Title order={6}>Speaker Sharing</Title>
              <Switch
                checked={isSpeakerSharing}
                onChange={(event) => setSpeakerSharing(event.currentTarget.checked)}
              />
            </Group>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}