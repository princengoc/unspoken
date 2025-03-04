"use client";
import { useState, useEffect, useRef } from "react";
import { RecordingState } from "@/core/audio/types";

const MAX_RECORDING_DURATION = 5 * 60; // 5 minutes in seconds

export const useAudioRecording = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });

  const recorderRef = useRef<any | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef<boolean>(false);

  const startRecording = async () => {
    try {
      // Reset any existing recording
      stopRecording();

      // Dynamically import RecordRTC only when needed (in the browser)
      const { default: RecordRTC } = await import("recordrtc");

      // Browser detection
      const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
      const isChrome =
        /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );

      // Browser-specific audio constraints
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      // Firefox-specific optimizations
      if (isFirefox) {
        audioConstraints.echoCancellation = true;
        audioConstraints.noiseSuppression = true;
        audioConstraints.autoGainControl = false; // Sometimes helps reduce initial noise
      }

      // Chrome-specific optimizations
      if (isChrome) {
        audioConstraints.echoCancellation = true;
        audioConstraints.noiseSuppression = true;
        audioConstraints.autoGainControl = true;
        audioConstraints.sampleRate = 48000; // Higher sample rate for Chrome
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });

      streamRef.current = stream;

      // Show initializing state for all browsers to allow mic to stabilize
      setRecordingState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        initializing: true, // Add an initializing state
      });

      // Wait for the microphone to stabilize before recording
      // Longer delay for Firefox which needs more time
      const delayTime = isFirefox ? 500 : 250;
      await new Promise((resolve) => setTimeout(resolve, delayTime));

      // Choose optimal format for the platform
      // Use type assertion to handle the TypeScript type constraint
      let mimeType = "audio/webm" as const; // Default
      let recorderType: any = RecordRTC.MediaStreamRecorder;

      if (isIOS || isSafari) {
        // For iOS/Safari better compatibility
        // We're using any here because RecordRTC types are strict about valid MIME types
        // but we need to use formats that might not be in the type definitions
        mimeType = "audio/mp4" as any;
        recorderType = RecordRTC.MediaStreamRecorder;
      }

      // Create RecordRTC instance with browser-optimized settings
      // Using type assertion to handle RecordRTC's type constraints
      const recorderOptions: any = {
        type: "audio",
        mimeType: mimeType,
        recorderType: recorderType,
        numberOfAudioChannels: 2,
        timeSlice: 1000, // Get data every 1 second
        disableLogs: false, // Enable logs during development
      };

      // Browser-specific recorder options
      if (isChrome) {
        // Chrome-specific settings for best quality
        recorderOptions.desiredSampRate = 48000;
        recorderOptions.bufferSize = 16384;
        recorderOptions.sampleRate = 48000;
        recorderOptions.audioBitsPerSecond = 128000; // 128 kbps
      } else if (isFirefox) {
        // Firefox-specific settings
        recorderOptions.desiredSampRate = 48000;
        recorderOptions.bufferSize = 16384;
        recorderOptions.audioBitsPerSecond = 128000;
      } else {
        // Default settings for other browsers
        recorderOptions.desiredSampRate = 44100;
        recorderOptions.bufferSize = 16384;
        recorderOptions.audioBitsPerSecond = 96000;
      }

      const recorder = new RecordRTC(stream, recorderOptions);

      recorderRef.current = recorder;

      // Start recording
      recorder.startRecording();
      isPausedRef.current = false;

      // Start timer with delay to help avoid initial static
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;

        setRecordingState((prev) => ({
          ...prev,
          duration: seconds,
          initializing: false, // Clear initializing state once timer starts
        }));

        // Auto-stop after MAX_RECORDING_DURATION
        if (seconds >= MAX_RECORDING_DURATION) {
          stopRecording();
        }
      }, 1000);

      // If not Firefox, set initial state directly
      if (!isFirefox) {
        setRecordingState((prev) => ({
          ...prev,
          initializing: false,
        }));
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      setRecordingState({
        isRecording: false,
        isPaused: false,
        duration: 0,
      });
    }
  };

  const pauseRecording = () => {
    if (
      recorderRef.current &&
      recordingState.isRecording &&
      !recordingState.isPaused
    ) {
      recorderRef.current.pauseRecording();
      isPausedRef.current = true;

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
      recorderRef.current &&
      recordingState.isRecording &&
      recordingState.isPaused
    ) {
      recorderRef.current.resumeRecording();
      isPausedRef.current = false;

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

    // Stop recorder
    if (recorderRef.current) {
      if (isPausedRef.current) {
        recorderRef.current.resumeRecording();
        isPausedRef.current = false;
      }

      recorderRef.current.stopRecording(() => {
        const audioBlob = recorderRef.current?.getBlob() || new Blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob,
          audioUrl,
        }));

        // Stop and release the media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      });
    }
  };

  const resetRecording = () => {
    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop and release the media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Release recorder
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }

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
