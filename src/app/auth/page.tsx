"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { 
  Container, 
  TextInput, 
  Button, 
  Title, 
  Stack, 
  Center, 
  Text, 
  PasswordInput, 
  Loader 
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

export default function AuthPage() {
  const { user, loading, loginWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, { toggle }] = useDisclosure(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false); // tracks if signup is complete

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
        await signUpWithEmail(email, password, username);
        // After signing up, clear the form and show the check email message
        setSignedUp(true);
      } else {
        await loginWithEmail(email, password);
        notifications.show({ title: "Logged in", message: "Welcome back!", color: "blue" });
      }
    } catch (error) {
      notifications.show({ title: "Error", message: error.message, color: "red" });
    }
  };

  // If the user has just signed up, show a message to check their email.
  if (isSignUp && signedUp) {
    return (
      <Container size="xs">
        <Center style={{ height: "100vh" }}>
          <Stack align="center" gap="md">
            <Title order={2}>Check your email</Title>
            <Text>Please verify your email to complete the sign-up process.</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs">
      <Center>
        <Stack align="center" gap="md">
          <Title order={2}>{isSignUp ? "Sign Up" : "Sign In"}</Title>

          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Render the Username input only for Sign Up */}
          {isSignUp && (
            <TextInput
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            visible={visible}
            onVisibilityChange={toggle}
            w="100%"
          />

          <Button fullWidth color="blue" onClick={handleLoginOrSignup}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Text 
            size="sm" 
            onClick={() => setIsSignUp(!isSignUp)} 
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </Text>
        </Stack>
      </Center>
    </Container>
  );
}
