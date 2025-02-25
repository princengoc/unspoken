// src/components/room/RoomPasscode.tsx

import { Card, Stack, Text, Button, CopyButton, Group } from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";

interface RoomPasscodeProps {
  passcode: string;
  onContinue: () => void;
}

export function RoomPasscode({ passcode, onContinue }: RoomPasscodeProps) {
  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="lg" align="center">
        <Text size="lg" fw={500}>
          Your Room Passcode
        </Text>

        <Text
          size="xl"
          fw={700}
          style={{
            letterSpacing: "0.25em",
            fontFamily: "monospace",
          }}
        >
          {passcode}
        </Text>

        <Text size="sm" c="dimmed" ta="center">
          Share this passcode with others to let them join your room. Keep it
          safe - anyone with this code can join.
        </Text>

        <Group>
          <CopyButton value={passcode} timeout={2000}>
            {({ copied, copy }) => (
              <Button
                variant="light"
                leftSection={
                  copied ? <IconCheck size={16} /> : <IconCopy size={16} />
                }
                opacity={copied ? 0.7 : 1} // optional: slightly fade when copied
                onClick={copy}
              >
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            )}
          </CopyButton>

          <Button onClick={onContinue}>Continue to Room</Button>
        </Group>
      </Stack>
    </Card>
  );
}
