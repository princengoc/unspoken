import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  ActionIcon,
  Loader,
  Progress,
  Stack,
  Badge,
  Paper,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconCheck,
  IconLock,
  IconWorldUpload,
} from "@tabler/icons-react";

import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { AudioMessage } from "@/core/audio/types";

interface AudioPlayerProps {
  message: AudioMessage;
}

export function AudioPlayer({ message }: AudioPlayerProps) {
  const { getAudioUrl, markAsListened } = useAudioMessages();
  const { members } = useRoomMembers();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Get sender username
  const sender = members.find((m) => m.id === message.sender_id);
  const senderName = sender?.username || "Unknown user";

  // Load the audio URL
  useEffect(() => {
    const loadAudio = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await getAudioUrl(message.file_path);

        if (result && result.url) {
          setAudioUrl(result.url);
        } else {
          setError("Failed to load audio message.");
        }
      } catch (err) {
        console.error("Error loading audio message:", err);
        setError("An error occurred while loading the audio message.");
      } finally {
        setLoading(false);
      }
    };

    loadAudio();

    // Clean up on unmount
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [message.id, message.file_path, getAudioUrl]);

  // Handle audio element events
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);

      // Start interval to update progress
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      progressInterval.current = setInterval(() => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }, 100);
    };

    const handlePause = () => {
      setIsPlaying(false);

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };

    const handleError = (e: Event) => {
      console.error("Audio playback error:", e);
      // More user-friendly error message
      setError("This audio format may not be supported by your browser.");

      // Attempt to recover by force-reloading the audio element
      if (audioUrl) {
        console.log("Attempting to reload audio with different approach");
        // Force reload the audio element
        audio.load();
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl]);

  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Reset error state when attempting to play
        setError(null);
        const playPromise = audioRef.current.play();

        // Handle the play promise to catch any autoplay or browser restrictions
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("Play error:", err);
            setError(
              "Unable to play this audio. It may be an unsupported format.",
            );
          });
        }
      }
    } catch (err) {
      console.error("Error in play/pause:", err);
      setError("Playback error. Please try again.");
    }
  };

  const handleMarkAsListened = async () => {
    await markAsListened(message.id);
  };

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      {/* Set crossOrigin attribute to help with CORS issues */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        crossOrigin="anonymous"
      />

      <Stack gap="xs">
        <Group align="apart">
          <Text fw={500}>Audio Message</Text>
          <Badge color={message.is_public ? "green" : "yellow"}>
            {message.is_public ? "Public" : "Private"}
          </Badge>
        </Group>

        <Text size="xs" c="dimmed">
          From: {senderName}
        </Text>

        {loading ? (
          <Group align="center" my="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Loading audio...
            </Text>
          </Group>
        ) : error ? (
          <Paper p="xs" withBorder color="red" radius="md">
            <Text size="sm" c="red">
              {error}
            </Text>
            <Button
              size="xs"
              mt="xs"
              onClick={() => {
                // Reset error and try again
                setError(null);
                if (audioRef.current && audioUrl) {
                  audioRef.current.load();
                }
              }}
            >
              Try Again
            </Button>
          </Paper>
        ) : (
          <>
            <Group align="apart" mt="xs">
              <ActionIcon
                color={isPlaying ? "red" : "blue"}
                variant="filled"
                onClick={handlePlayPause}
                disabled={!audioUrl}
                radius="xl"
              >
                {isPlaying ? (
                  <IconPlayerPause size={16} />
                ) : (
                  <IconPlayerPlay size={16} />
                )}
              </ActionIcon>

              <Text size="xs" style={{ fontFamily: "monospace" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </Group>

            <Progress
              value={progress}
              size="sm"
              radius="xl"
              transitionDuration={100}
            />

            <Group align="center" mt="xs">
              <Button
                leftSection={<IconCheck size={16} />}
                size="xs"
                onClick={handleMarkAsListened}
              >
                Mark as listened
              </Button>
            </Group>
          </>
        )}

        <Group align="right" mt="xs">
          <IconLock size={14} opacity={message.is_public ? 0.3 : 0.8} />
          <IconWorldUpload size={14} opacity={message.is_public ? 0.8 : 0.3} />
        </Group>
      </Stack>
    </Card>
  );
}
