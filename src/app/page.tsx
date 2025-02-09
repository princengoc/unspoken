'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Container, Button, Stack, Title, Text, Group } from '@mantine/core';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <Container size="sm" py="xl">
      <Stack gap="xl">
        <Stack gap="xs" ta="center">
          <Title order={1}>Welcome to Deeper</Title>
          <Text c="dimmed">Create or join a room to start playing</Text>
        </Stack>

        <Group justify="center" gap="md">
          <Button 
            size="lg"
            onClick={() => router.push('/room/create')}
          >
            Create Room
          </Button>
          <Button 
            size="lg" 
            variant="light"
            onClick={() => router.push('/room/join')}
          >
            Join Room
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}