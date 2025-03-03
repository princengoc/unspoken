import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Text,
  Group,
  Button,
  ActionIcon,
  Loader,
  Progress,
  Paper,
  Tooltip,
} from "@mantine/core";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconCheck,
  IconLock,
  IconWorld,
} from "@tabler/icons-react";

import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { AudioMessage } from "@/core/audio/types";

interface AudioPlayerProps {
  message: AudioMessage;
}

export function AudioPlayer({ message }: AudioPlayerProps) {
  const { getAudioUrl, markAsListened } = useAudioMessages();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playedOnce, setPlayedOnce] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, [message.id, message.file_path, getAudioUrl]);

  const resetCountdown = () => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    setCountdown(null);
  };

  const startCountdown = () => {
    resetCountdown();

    // Start with 15 seconds
    setCountdown(15);

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Time's up, clear the interval
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          return 0; // Set to 0 instead of null, we'll handle the marking in useEffect
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Add effect to handle auto-marking when countdown reaches 0
  useEffect(() => {
    // When countdown reaches 0, mark as listened
    if (countdown === 0) {
      // Using setTimeout to push this operation to the next event loop cycle
      // This avoids the "setState during render" React error
      const timeoutId = setTimeout(() => {
        markAsListened(message.id);
        setCountdown(null);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    return;
  }, [countdown, message.id, markAsListened]);

  // Handle audio element events
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      resetCountdown(); // Reset countdown when playing starts

      // Start interval to update progress
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      progressInterval.current = setInterval(() => {
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
      setPlayedOnce(true); // played once
      setProgress(100); // Set to 100% when ended

      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }

      // Start the countdown when audio ends
      startCountdown();
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

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, message.id, markAsListened]);

  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Reset error state when attempting to play
        setError(null);
        // Reset countdown if it's currently active
        resetCountdown();

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
    resetCountdown();
    await markAsListened(message.id);
  };

  return (
    <Card shadow="sm" padding="xs" radius="md">
      {/* Set crossOrigin attribute to help with CORS issues */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        crossOrigin="anonymous"
      />

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
          <Group gap="xs" mt="xs">
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
            <Progress
              value={progress}
              striped
              animated={isPlaying}
              size="sm"
              radius="xl"
              transitionDuration={100}
              style={{ flexGrow: 1 }}
            />

            {/* Compact public/private indicator */}
            <Tooltip
              label={message.is_public ? "Public message" : "Private message"}
              withArrow
              position="top"
            >
              <ActionIcon
                variant="subtle"
                color={message.is_public ? "green" : "orange"}
                size="xs"
              >
                {message.is_public ? (
                  <IconWorld size={14} />
                ) : (
                  <IconLock size={14} />
                )}
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={
                countdown !== null && countdown > 0
                  ? `Auto-marking as listened in ${countdown}s`
                  : "Mark as listened"
              }
              withArrow
              position="top"
            >
              <ActionIcon
                variant="filled"
                onClick={() => {
                  // Only call markAsListened through the click handler, not during render
                  handleMarkAsListened();
                }}
                color={playedOnce ? "orange" : "gray"}
                radius="xl"
                disabled={!playedOnce} // need to have played at least once
              >
                {countdown !== null && countdown > 0 ? (
                  <Text size="xs" fw="bold">
                    {countdown}
                  </Text>
                ) : (
                  <IconCheck size={16} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </>
      )}
    </Card>
  );
}
