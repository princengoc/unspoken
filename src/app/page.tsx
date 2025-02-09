"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { GameLayout } from "@/components/game/GameLayout";
import { Container, Button, Center, Stack, Title, Loader } from "@mantine/core";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  console.log(`User: ${user}`);
  console.log(`Loading: ${loading}`);

  useEffect(() => {
    if (!loading && !user) {
      console.log("User not logged in, redirecting to /auth");
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  if (!user) return null; // Prevent flickering while redirecting

  return (
    <Container>
      <Center>
        <Stack align="center" spacing="md">
          <Title order={2}>Welcome, {user.email}</Title>
          <Button color="red" onClick={logout}>
            Logout
          </Button>
        </Stack>
      </Center>
      <GameLayout />
    </Container>
  );
}
