// src/components/layout/NavBar.tsx
import { Group, Container, Text, Button, Menu, Avatar } from '@mantine/core';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <Container size="xl" py="md">
      <Group justify="space-between">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Text size="xl" fw={700}>Deeper</Text>
        </Link>

        {user ? (
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Avatar 
                color="blue" 
                radius="xl" 
                style={{ cursor: 'pointer' }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Account</Menu.Label>
              <Menu.Item onClick={() => router.push('/profile')}>
                Profile Settings
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" onClick={logout}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Button onClick={() => router.push('/auth')}>
            Sign In
          </Button>
        )}
      </Group>
    </Container>
  );
}
