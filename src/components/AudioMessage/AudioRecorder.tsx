import React, { useState, useRef } from "react";
import { Text, Group, Switch, ActionIcon, Stack, Alert } from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerPlay,
  IconTrash,
  IconWorldUpload,
  IconLock,
  IconAlertCircle,
  IconSend,
} from "@tabler/icons-react";

import { useAudioRecording } from "@/hooks/audio/useAudioRecording";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { AudioPrivacy } from "@/core/audio/types";

interface AudioRecorderProps {
  onComplete?: () => void;
  targetPlayerId?: string;
  isPublic?: boolean;
}

export function AudioRecorder({
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

  const handleReset = () => {
    // Reset the recording state through the hook
    resetRecording();

    // Properly clean up the audio reference
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    // Reset UI states
    setIsPlaying(false);
    setError(null);

    // Reset the recording state in context
    setRecording(false);
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
        {/* Initial state - Record button */}
        {!recordingState.isRecording &&
          !recordingState.audioBlob &&
          !recordingState.initializing && (
            <>
              <Text size="sm" mr="xs">
                Record your story
              </Text>
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
            </>
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

        {/* Recording completed - Show review options with send button at the same level */}
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
              onClick={handleReset}
              title="Reset Recording"
            >
              <IconTrash size={18} />
            </ActionIcon>

            <ActionIcon
              color="green"
              variant="filled"
              radius="xl"
              size="md"
              onClick={handleSend}
              loading={isUploading}
              disabled={isUploading}
              title={`Send Recording (${privacy === "public" ? "Public" : "Private"})`}
              style={{ position: "relative" }}
            >
              <IconSend size={18} />
              {privacy === "private" && (
                <IconLock
                  size={10}
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    background: "white",
                    borderRadius: "50%",
                    padding: "1px",
                  }}
                />
              )}
            </ActionIcon>
          </>
        )}
      </Group>

      {/* Show privacy toggle only after recording is complete */}
      {!recordingState.isRecording && recordingState.audioBlob && !isPublic && (
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
    </Stack>
  );
}
