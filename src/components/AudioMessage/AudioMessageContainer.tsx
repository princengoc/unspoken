import React, { useState } from "react";
import {
  Stack,
  Button,
  Group,
  Text,
  ActionIcon,
  Paper,
  Collapse,
  Badge,
  Loader,
} from "@mantine/core";
import {
  IconMicrophone,
  IconRefresh,
  IconMessageCircle,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

import { AudioRecorder } from "./AudioRecorder";
import { AudioPlayer } from "./AudioPlayer";
import { useAudioMessages } from "@/context/AudioMessagesProvider";

interface AudioMessageContainerProps {
  className?: string;
}

export function AudioMessageContainer({
  className,
}: AudioMessageContainerProps) {
  const { messages, loading, recording, refreshMessages, setRecording } =
    useAudioMessages();
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleStartRecording = () => {
    setRecording(true);
    setExpanded(true);
  };

  const handleCancelRecording = () => {
    setRecording(false);
  };

  return (
    <Paper shadow="xs" p="md" withBorder className={className} radius="md">
      <Stack gap="xs">
        <Group align="center">
          <Group>
            <IconMessageCircle size={16} />
            <Text fw={500} size="sm">
              Audio Messages
            </Text>
            {messages.length > 0 && (
              <Badge color="blue" size="sm">
                {messages.length}
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            <ActionIcon size="sm" onClick={refreshMessages} loading={loading}>
              <IconRefresh size={16} />
            </ActionIcon>

            <ActionIcon size="sm" onClick={handleToggleExpand}>
              {expanded ? (
                <IconChevronUp size={16} />
              ) : (
                <IconChevronDown size={16} />
              )}
            </ActionIcon>
          </Group>
        </Group>

        <Collapse in={expanded}>
          <Stack gap="md" mt="xs">
            {recording ? (
              <AudioRecorder onCancel={handleCancelRecording} />
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <AudioPlayer key={message.id} message={message} />
              ))
            ) : loading ? (
              <Group align="center" py="md">
                <Loader size="sm" />
                <Text size="sm" color="dimmed">
                  Checking for messages...
                </Text>
              </Group>
            ) : (
              <Text size="sm" c="dimmed" ta="center" py="xs">
                No audio messages available
              </Text>
            )}
          </Stack>
        </Collapse>

        {!recording && (
          <Button
            leftSection={<IconMicrophone size={16} />}
            size="xs"
            variant={expanded ? "light" : "filled"}
            fullWidth
            onClick={handleStartRecording}
            mt={expanded ? "xs" : undefined}
          >
            Record Audio Message
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
