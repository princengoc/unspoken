import { useState, useEffect, useRef } from "react";
import { RecordingState } from "@/core/audio/types";

const MAX_RECORDING_DURATION = 5 * 60; // 5 minutes in seconds

export const useAudioRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Reset any existing recording
      stopRecording();

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up event handlers
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;

        setRecordingState((prev) => ({
          ...prev,
          duration: seconds,
        }));

        // Auto-stop after MAX_RECORDING_DURATION
        if (seconds >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 1000);

      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
      });
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const pauseRecording = () => {
    if (
      mediaRecorderRef.current &&
      recordingState.isRecording &&
      !recordingState.isPaused
    ) {
      mediaRecorderRef.current.pause();

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setRecordingState((prev) => ({
        ...prev,
        isPaused: true,
      }));
    }
  };

  const resumeRecording = () => {
    if (
      mediaRecorderRef.current &&
      recordingState.isRecording &&
      recordingState.isPaused
    ) {
      mediaRecorderRef.current.resume();

      // Restart timer
      let seconds = recordingState.duration;
      timerRef.current = setInterval(() => {
        seconds += 1;

        setRecordingState((prev) => ({
          ...prev,
          duration: seconds,
        }));

        // Auto-stop after MAX_RECORDING_DURATION
        if (seconds >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 1000);

      setRecordingState((prev) => ({
        ...prev,
        isPaused: false,
      }));
    }
  };

  const stopRecording = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop media recorder
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }

    // Stop and release the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // We don't update state here because the onstop handler will do that
  };

  const resetRecording = () => {
    stopRecording();

    // Release any existing audio URL
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }

    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      resetRecording();
    };
  }, []);

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
};
