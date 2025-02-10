// src/components/room/JoinRoom.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, TextInput, Stack, Button, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRoom } from '@/hooks/room/useRoom';

export function JoinRoom() {
  const router = useRouter();
  const { joinRoom, loading } = useRoom();
  const [passcode, setPasscode] = useState('');

  // Format passcode as user types: uppercase and limit to 6 chars
  const handlePasscodeChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setPasscode(formatted);
  };

  const handleJoin = async () => {
    if (passcode.length !== 6) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a valid 6-character passcode',
        color: 'red'
      });
      return;
    }

    try {
      const room = await joinRoom(passcode);
      notifications.show({
        title: 'Success',
        message: 'Joined room successfully',
        color: 'green'
      });
      router.push(`/room/${room.id}`);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to join room',
        color: 'red'
      });
    }
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={500}>Join a Room</Text>

        <TextInput
          label="Room Passcode"
          placeholder="Enter 6-character code"
          value={passcode}
          onChange={(e) => handlePasscodeChange(e.target.value)}
          maxLength={6}
          style={{ 
            letterSpacing: '0.25em',
            textTransform: 'uppercase'
          }}
          data-autofocus
        />

        <Button 
          onClick={handleJoin} 
          loading={loading}
          fullWidth
          disabled={passcode.length !== 6}
        >
          Join Room
        </Button>
      </Stack>
    </Card>
  );
}