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
  Loader,
  Group,
  Alert,
} from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

export default function AuthPage() {
  const { user, loading, loginWithEmail, signUpWithEmail, resetPassword } =
    useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, { toggle }] = useDisclosure(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false); // tracks if signup is complete
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        notifications.show({
          title: "Logged in",
          message: "Welcome back!",
          color: "blue",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      notifications.show({
        title: "Email Required",
        message: "Please enter your email address first",
        color: "orange",
      });
      return;
    }

    setIsResetting(true);
    try {
      await resetPassword(email);
      setResetEmailSent(true);
      notifications.show({
        title: "Reset Email Sent",
        message: "Check your email for password reset instructions",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to send reset email",
        color: "red",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // If the user has just signed up, show a message to check their email.
  if (isSignUp && signedUp) {
    return (
      <Container size="xs">
        <Center style={{ height: "100vh" }}>
          <Stack align="center" gap="md">
            <Title order={2}>Check your email</Title>
            <Text>
              Please verify your email to complete the sign-up process.
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // If reset email was sent, show confirmation
  if (resetEmailSent) {
    return (
      <Container size="xs">
        <Center style={{ height: "100vh" }}>
          <Stack align="center" gap="md">
            <Title order={2}>Reset Email Sent</Title>
            <Alert icon={<IconCheck size={16} />} color="green">
              <Text>
                We've sent password reset instructions to{" "}
                <strong>{email}</strong>. Please check your email and follow the
                link to reset your password.
              </Text>
            </Alert>
            <Button
              variant="outline"
              onClick={() => {
                setResetEmailSent(false);
                setEmail("");
              }}
            >
              Back to Sign In
            </Button>
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

          <div style={{ width: "100%" }}>
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

            {/* Forgot Password Button - only show for sign in */}
            {!isSignUp && (
              <Group justify="flex-end" mt={4}>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={handleForgotPassword}
                  loading={isResetting}
                  disabled={!email.trim()}
                >
                  Forgot your password?
                </Button>
              </Group>
            )}
          </div>

          <Button fullWidth color="blue" onClick={handleLoginOrSignup}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>

          <Text
            size="sm"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setResetEmailSent(false); // Reset the forgot password state when switching
            }}
            style={{ cursor: "pointer", textDecoration: "underline" }}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Text>
        </Stack>
      </Center>
    </Container>
  );
}
