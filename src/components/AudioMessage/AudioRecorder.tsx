import React, { useState, useRef } from "react";
import {
  Text,
  Group,
  Button,
  Switch,
  ActionIcon,
  Stack,
  Alert,
} from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerPlay,
  IconTrash,
  IconWorldUpload,
  IconLock,
  IconAlertCircle,
} from "@tabler/icons-react";

import { useAudioRecording } from "@/hooks/audio/useAudioRecording";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { AudioPrivacy } from "@/core/audio/types";

interface AudioRecorderProps {
  onCancel?: () => void;
  onComplete?: () => void;
  targetPlayerId?: string;
  isPublic?: boolean;
}

export function AudioRecorder({
  onCancel,
  onComplete,
  targetPlayerId,
  isPublic = false,
}: AudioRecorderProps) {
  const {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();

  const { sendAudioMessage, setRecording } = useAudioMessages();

  const [privacy, setPrivacy] = useState<AudioPrivacy>(
    isPublic ? "public" : "private",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCancel = () => {
    resetRecording();
    setError(null);
    setRecording(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    onCancel?.();
  };

  const handleSend = async () => {
    if (!recordingState.audioBlob) {
      setError("No recording to send.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const result = await sendAudioMessage(
        recordingState.audioBlob,
        privacy,
        targetPlayerId,
      );

      if (result) {
        resetRecording();
        setRecording(false);
        onComplete?.();
      } else {
        setError("Failed to upload audio message.");
      }
    } catch (err) {
      console.error("Error sending audio message:", err);
      setError("An error occurred while sending your message.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPreview = () => {
    if (recordingState.audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(recordingState.audioUrl);
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
        });
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Stack align="center" gap="xs">
      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />}>
          {error}
        </Alert>
      )}

      <Group align="center" gap="xs">
        <Text size="md" style={{ fontFamily: "monospace" }}>
          {formatTime(recordingState.duration)}
        </Text>

        {recordingState.duration > 0 && recordingState.duration < 300 && (
          <Text size="xs" c="dimmed">
            {formatTime(300 - recordingState.duration)} remaining
          </Text>
        )}
      </Group>

      <Group gap="xs" justify="center">
        {/* Initial state - Just Record button */}
        {!recordingState.isRecording &&
          !recordingState.audioBlob &&
          !recordingState.initializing && (
            <ActionIcon
              color="red"
              variant="filled"
              radius="xl"
              size="md"
              onClick={startRecording}
              title="Start Recording"
            >
              <IconMicrophone size={18} />
            </ActionIcon>
          )}

        {/* Recording in progress */}
        {recordingState.isRecording && !recordingState.isPaused && (
          <>
            <ActionIcon
              color="yellow"
              variant="filled"
              radius="xl"
              size="md"
              onClick={pauseRecording}
              title="Pause Recording"
            >
              <IconPlayerPause size={18} />
            </ActionIcon>

            <ActionIcon
              color="red"
              variant="filled"
              radius="xl"
              size="md"
              onClick={stopRecording}
              title="Stop Recording"
            >
              <IconPlayerStop size={18} />
            </ActionIcon>
          </>
        )}

        {/* Recording paused */}
        {recordingState.isRecording && recordingState.isPaused && (
          <>
            <ActionIcon
              color="green"
              variant="filled"
              radius="xl"
              size="md"
              onClick={resumeRecording}
              title="Resume Recording"
            >
              <IconPlayerPlay size={18} />
            </ActionIcon>

            <ActionIcon
              color="red"
              variant="filled"
              radius="xl"
              size="md"
              onClick={stopRecording}
              title="Stop Recording"
            >
              <IconPlayerStop size={18} />
            </ActionIcon>
          </>
        )}

        {/* Recording completed - Show review options */}
        {!recordingState.isRecording && recordingState.audioBlob && (
          <>
            <ActionIcon
              color="blue"
              variant="filled"
              radius="xl"
              size="md"
              onClick={handlePlayPreview}
              title={isPlaying ? "Pause Preview" : "Play Preview"}
            >
              {isPlaying ? (
                <IconPlayerPause size={18} />
              ) : (
                <IconPlayerPlay size={18} />
              )}
            </ActionIcon>

            <ActionIcon
              color="gray"
              variant="filled"
              radius="xl"
              size="md"
              onClick={resetRecording}
              title="Reset Recording"
            >
              <IconTrash size={18} />
            </ActionIcon>
          </>
        )}
      </Group>

      {/* Show send options only after recording is complete */}
      {!recordingState.isRecording && recordingState.audioBlob && (
        <>
          {/* More discrete privacy toggle */}
          {!isPublic && (
            <Group justify="center" gap="xs">
              <Switch
                size="xs"
                label={
                  <Group gap="xs">
                    {privacy === "public" ? (
                      <IconWorldUpload size={14} />
                    ) : (
                      <IconLock size={14} />
                    )}
                    <Text size="xs">
                      {privacy === "public" ? "Public" : "Private"}
                    </Text>
                  </Group>
                }
                checked={privacy === "public"}
                onChange={(event) =>
                  setPrivacy(event.currentTarget.checked ? "public" : "private")
                }
              />
            </Group>
          )}

          <Group justify="center" gap="xs">
            <Button
              variant="subtle"
              size="xs"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              size="xs"
              onClick={handleSend}
              loading={isUploading}
              leftSection={
                isUploading ? undefined : <IconWorldUpload size={14} />
              }
            >
              Send
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}
