import { useState, useEffect } from 'react';
import { Card, TextInput, Button, Stack, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useProfile } from '@/hooks/auth/useProfile';
import { useAuth } from '@/context/AuthProvider';

export function ProfileSettings() {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleSubmit = async () => {
    try {
      await updateProfile({ username });
      notifications.show({
        title: 'Success',
        message: 'Profile updated successfully',
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Card shadow="sm" p="lg">
      <Stack>
        <Text size="xl" fw={700}>Profile Settings</Text>
        
        <TextInput
          label="Email"
          value={user?.email || ''}
          disabled
        />

        <TextInput
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />

        <Group justify="flex-end">
          <Button onClick={handleSubmit}>
            Save Changes
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
