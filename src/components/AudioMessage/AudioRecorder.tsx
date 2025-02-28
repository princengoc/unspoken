import React, { useState, useRef, useEffect } from "react";
import { Text, Group, ActionIcon, Stack, Alert } from "@mantine/core";
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerPlay,
  IconTrash,
  IconSend,
  IconAlertCircle,
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

  const { sendAudioMessage, setRecording, refreshMessages } = useAudioMessages();

  // All reactions are private by default
  const privacy: AudioPrivacy = isPublic ? "public" : "private";
  
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
        // Cleanup the recording state and UI
        resetRecording();
        setRecording(false);
        
        // Ensure messages are refreshed across the app
        await refreshMessages();
        
        // Notify parent component
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

  const handleReset = async () => {
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
    
    // Make sure context knows recording is done
    await refreshMessages();
    
    // Call onComplete to notify parent component
    onComplete?.();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      
      // Make sure recording state is reset when component unmounts
      if (recordingState.isRecording) {
        resetRecording();
        setRecording(false);
      }
    };
  }, [recordingState.isRecording, resetRecording, setRecording]);

  // Standard layout
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
              title="Send Recording"
            >
              <IconSend size={18} />
            </ActionIcon>
          </>
        )}
      </Group>
    </Stack>
  );
}