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
        <Stack gap="md" ta="center" align="center" mt="xl">
        <Title order={1}>
          Unspoken
        </Title>
        <Text size="lg" c="gray.6" fw={500}>
          Stories waiting to be told
        </Text>
        <Text size="md" c="gray.7" maw={450}>
          A card game designed to spark meaningful conversations. Because the best talks don't just happen, they start with the right question.
        </Text>
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