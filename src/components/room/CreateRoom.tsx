// src/components/room/CreateRoom.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, TextInput, Stack, Button, Switch, Group, Text, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAdjustments } from '@tabler/icons-react';
import { useRoomHook } from '@/hooks/room/useRoomHook';
import { RoomPasscode } from './RoomPasscode';
import type { RoomSettings } from '@/core/game/types';

export function CreateRoom() {
  const router = useRouter();
  const { createRoom, loading } = useRoomHook();
  const [name, setName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    ripple_only: false,
    card_depth: null
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
      console.error('CreateRoom error:', error);
      let errorMessage = 'Failed to create room';
      
      if (error instanceof Error) {
        // Extract more specific error details if available
        const supabaseError = error as any; // Type assertion for Supabase error properties
        errorMessage = supabaseError.details || supabaseError.message || errorMessage;
        
        // Log detailed error information
        console.error('Detailed error:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });
      }
  
      notifications.show({
        title: 'Error',
        message: errorMessage,
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
              label="Use only rippled and exchanged cards"
              description="If enabled, players will only use cards they rippled or exchanged. If disabled, additional cards will be dealt."
              checked={settings.ripple_only}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                ripple_only: e.currentTarget.checked
              }))}
            />
           <Select
             label="Card Depth"
             description="Filter cards by conversation depth level"
             data={[
               { value: 'all', label: 'All Depths' },
               { value: '1', label: 'Light (Level 1)' },
               { value: '2', label: 'Medium (Level 2)' },
               { value: '3', label: 'Deep (Level 3)' }
             ]}
             value={settings.card_depth?.toString() || 'all'}
             onChange={(value) => setSettings(prev => ({
               ...prev,
               card_depth: value === 'all' ? null : parseInt(value as string) as 1 | 2 | 3
             }))}
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