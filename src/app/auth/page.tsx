"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Container, TextInput, Button, Title, Stack, Center, Text, PasswordInput, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";

export default function AuthPage() {
  const { user, loading, loginWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  const handleLoginOrSignup = async () => {
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        notifications.show({ title: "Success", message: "Sign-up successful! Please check your email for confirmation.", color: "green" });
      } else {
        await loginWithEmail(email, password);
        notifications.show({ title: "Logged in", message: "Welcome back!", color: "blue" });
      }
    } catch (error: any) {
      notifications.show({ title: "Error", message: error.message, color: "red" });
    }
  };

  return (
    <Container size="xs">
      <Center>
        <Stack align="center" spacing="md">
          <Title order={2}>{isSignUp ? "Sign Up" : "Sign In"}</Title>

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button fullWidth color="blue" onClick={handleLoginOrSignup}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Text size="sm" onClick={() => setIsSignUp(!isSignUp)} style={{ cursor: "pointer", textDecoration: "underline" }}>
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </Text>
        </Stack>
      </Center>
    </Container>
  );
}
