"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import {
  Container,
  PasswordInput,
  Button,
  Title,
  Stack,
  Center,
  Text,
  Loader,
  Alert,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconAlertCircle } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { supabase } from "@/services/supabase/client";

export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visible, { toggle }] = useDisclosure(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          setIsValidSession(false);
        } else if (session?.user) {
          // We have a valid session from the password reset email
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsValidSession(false);
      } finally {
        setSessionChecked(true);
      }
    };

    checkSession();
  }, []);

  // If already logged in and not coming from reset email, redirect to home
  useEffect(() => {
    if (!loading && user && sessionChecked && !isValidSession) {
      router.push("/");
    }
  }, [user, loading, router, sessionChecked, isValidSession]);

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      notifications.show({
        title: "Password Mismatch",
        message: "Passwords do not match",
        color: "red",
      });
      return;
    }

    if (newPassword.length < 6) {
      notifications.show({
        title: "Password Too Short",
        message: "Password must be at least 6 characters long",
        color: "red",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updatePassword(newPassword);
      notifications.show({
        title: "Password Updated",
        message: "Your password has been successfully updated",
        color: "green",
      });

      // Redirect to home page after successful password update
      router.push("/");
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update password",
        color: "red",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading while checking session
  if (loading || !sessionChecked) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Show error if invalid session
  if (!isValidSession) {
    return (
      <Container size="xs">
        <Center style={{ height: "100vh" }}>
          <Paper p="xl" withBorder>
            <Stack align="center" gap="md">
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                <Text>
                  Invalid or expired reset link. Please request a new password
                  reset email.
                </Text>
              </Alert>
              <Button onClick={() => router.push("/auth")}>
                Back to Sign In
              </Button>
            </Stack>
          </Paper>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xs">
      <Center style={{ height: "100vh" }}>
        <Paper p="xl" withBorder shadow="md" style={{ width: "100%" }}>
          <Stack align="center" gap="md">
            <Title order={2}>Reset Your Password</Title>
            <Text c="dimmed" ta="center">
              Enter your new password below
            </Text>

            <PasswordInput
              label="New Password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              visible={visible}
              onVisibilityChange={toggle}
              required
              w="100%"
            />

            <PasswordInput
              label="Confirm New Password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              visible={visible}
              required
              w="100%"
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? "Passwords do not match"
                  : null
              }
            />

            <Button
              fullWidth
              onClick={handleUpdatePassword}
              loading={isUpdating}
              disabled={
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 6
              }
            >
              Update Password
            </Button>

            <Button variant="subtle" onClick={() => router.push("/auth")}>
              Back to Sign In
            </Button>
          </Stack>
        </Paper>
      </Center>
    </Container>
  );
}
