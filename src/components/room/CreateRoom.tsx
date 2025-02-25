// src/components/room/CreateRoom.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  TextInput,
  Stack,
  Button,
  Switch,
  Group,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAdjustments } from "@tabler/icons-react";
import { useRoomAPI } from "@/hooks/room/useRoomAPI";
import { RoomPasscode } from "./RoomPasscode";
import type { RoomSettings } from "@/core/game/types";
import { GameSettingsForm } from "./GameSettingsForm";

export function CreateRoom() {
  const router = useRouter();
  const { createRoom, loading } = useRoomAPI();
  const [name, setName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    deal_extras: true,
    card_depth: null,
    is_encore: false,
  });
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [roomPasscode, setRoomPasscode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      notifications.show({
        title: "Error",
        message: "Please enter a room name",
        color: "red",
      });
      return;
    }

    try {
      const room = await createRoom(name, settings);
      setCreatedRoomId(room.id);
      setRoomPasscode(room.passcode);
      notifications.show({
        title: "Success",
        message: "Room created successfully",
        color: "green",
      });
    } catch (error) {
      console.error("CreateRoom error:", error);
      let errorMessage = "Failed to create room";

      if (error instanceof Error) {
        // Extract more specific error details if available
        const supabaseError = error as any; // Type assertion for Supabase error properties
        errorMessage =
          supabaseError.details || supabaseError.message || errorMessage;

        // Log detailed error information
        console.error("Detailed error:", {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code,
        });
      }

      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    }
  };

  const handleContinue = () => {
    if (createdRoomId) {
      router.push(`/room/${createdRoomId}`);
    }
  };

  if (roomPasscode) {
    return <RoomPasscode passcode={roomPasscode} onContinue={handleContinue} />;
  }

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        <TextInput
          label="Room Name"
          placeholder="Enter a name for your game room"
          value={name}
          onChange={(e) => setName(e.target.value)}
          data-autofocus
        />

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Game Settings
          </Text>
          <Switch
            label={<IconAdjustments size={16} />}
            checked={showSettings}
            onChange={(e) => setShowSettings(e.currentTarget.checked)}
          />
        </Group>

        {showSettings && (
          <GameSettingsForm initialSettings={settings} onChange={setSettings} />
        )}

        <Button onClick={handleCreate} loading={loading} fullWidth>
          Create Room
        </Button>
      </Stack>
    </Card>
  );
}
