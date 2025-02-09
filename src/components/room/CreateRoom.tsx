// src/components/room/CreateRoom.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, TextInput, Stack, Button, Switch, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAdjustments } from '@tabler/icons-react';
import { useRoom } from '@/lib/hooks/useRoom';
import { RoomPasscode } from './RoomPasscode';
import type { RoomSettings } from '@/lib/supabase/types';

export function CreateRoom() {
  const router = useRouter();
  const { createRoom, loading } = useRoom();
  const [name, setName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    allow_card_exchanges: true,
    allow_ripple_effects: true,
    rounds_per_player: 3
  });
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [roomPasscode, setRoomPasscode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a room name',
        color: 'red'
      });
      return;
    }

    try {
      const room = await createRoom(name, settings);
      setCreatedRoomId(room.id);
      setRoomPasscode(room.passcode);
      notifications.show({
        title: 'Success',
        message: 'Room created successfully',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create room',
        color: 'red'
      });
    }
  };

  const handleContinue = () => {
    if (createdRoomId) {
      router.push(`/room/${createdRoomId}`);
    }
  };

  if (roomPasscode) {
    return (
      <RoomPasscode 
        passcode={roomPasscode}
        onContinue={handleContinue}
      />
    );
  }

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        <TextInput
          label="Room Name"
          placeholder="Enter a name for your game room"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-autofocus
        />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">Game Settings</Text>
          <Switch
            label={<IconAdjustments size={16} />}
            checked={showSettings}
            onChange={(e) => setShowSettings(e.currentTarget.checked)}
          />
        </Group>

        {showSettings && (
          <Stack gap="xs">
            <Switch
              label="Allow Card Exchanges"
              checked={settings.allow_card_exchanges}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                allow_card_exchanges: e.currentTarget.checked
              }))}
            />
            <Switch
              label="Enable Ripple Effects"
              checked={settings.allow_ripple_effects}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                allow_ripple_effects: e.currentTarget.checked
              }))}
            />
            <TextInput
              type="number"
              label="Rounds per Player"
              value={settings.rounds_per_player}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                rounds_per_player: parseInt(e.target.value) || 3
              }))}
              min={1}
              max={10}
            />
          </Stack>
        )}

        <Button 
          onClick={handleCreate} 
          loading={loading}
          fullWidth
        >
          Create Room
        </Button>
      </Stack>
    </Card>
  );
}