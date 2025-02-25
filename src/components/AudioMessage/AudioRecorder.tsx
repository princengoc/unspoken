import React, { useState } from 'react';
import {
  Card,
  Text,
  Group,
  Button,
  Switch,
  ActionIcon,
  Stack,
  Alert
} from '@mantine/core';
import {
  IconMicrophone,
  IconPlayerPause,
  IconPlayerStop,
  IconPlayerPlay,
  IconTrash,
  IconWorldUpload,
  IconLock,
  IconAlertCircle
} from '@tabler/icons-react';

import { useAudioRecording } from '@/hooks/audio/useAudioRecording';
import { useAudioMessages } from '@/context/AudioMessagesProvider';
import { AudioPrivacy } from '@/core/audio/types';

interface AudioRecorderProps {
  onCancel?: () => void;
}

export function AudioRecorder({ onCancel }: AudioRecorderProps) {
  const {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();

  const { sendAudioMessage, setRecording } = useAudioMessages();
  
  const [privacy, setPrivacy] = useState<AudioPrivacy>('private');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleCancel = () => {
    resetRecording();
    setError(null);
    setRecording(false);
    onCancel?.();
  };
  
  const handleSend = async () => {
    if (!recordingState.audioBlob) {
      setError('No recording to send.');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      const result = await sendAudioMessage(
        recordingState.audioBlob,
        privacy
      );
      
      if (result) {
        resetRecording();
        setRecording(false);
      } else {
        setError('Failed to upload audio message.');
      }
    } catch (err) {
      console.error('Error sending audio message:', err);
      setError('An error occurred while sending your message.');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPreview = () => {
    if (recordingState.audioUrl) {
      const audio = new Audio(recordingState.audioUrl);
      audio.play();
    }
  };
  
  return (
    <Card shadow="sm" p="md" radius="md" withBorder>
      <Stack gap="md">
        <Text fw={500} size="lg">Record Audio Message</Text>
        
        {error && (
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
        
        <Group align="center">
          <Text size="xl" style={{ fontFamily: 'monospace' }}>
            {formatTime(recordingState.duration)}
          </Text>
          
          {recordingState.duration > 0 && recordingState.duration < 300 && (
            <Text size="xs" c="dimmed">
              {formatTime(300 - recordingState.duration)} remaining
            </Text>
          )}
        </Group>
        
        <Group align="center" gap="md">
          {!recordingState.isRecording && !recordingState.audioBlob && (
            <ActionIcon 
              color="red" 
              variant="filled" 
              radius="xl" 
              size="xl"
              onClick={startRecording}
            >
              <IconMicrophone size={20} />
            </ActionIcon>
          )}
          
          {recordingState.isRecording && !recordingState.isPaused && (
            <>
              <ActionIcon 
                color="yellow" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={pauseRecording}
              >
                <IconPlayerPause size={20} />
              </ActionIcon>
              
              <ActionIcon 
                color="red" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={stopRecording}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </>
          )}
          
          {recordingState.isRecording && recordingState.isPaused && (
            <>
              <ActionIcon 
                color="green" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={resumeRecording}
              >
                <IconPlayerPlay size={20} />
              </ActionIcon>
              
              <ActionIcon 
                color="red" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={stopRecording}
              >
                <IconPlayerStop size={20} />
              </ActionIcon>
            </>
          )}
          
          {!recordingState.isRecording && recordingState.audioBlob && (
            <>
              <ActionIcon 
                color="blue" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={handlePlayPreview}
              >
                <IconPlayerPlay size={20} />
              </ActionIcon>
              
              <ActionIcon 
                color="gray" 
                variant="filled" 
                radius="xl" 
                size="xl"
                onClick={resetRecording}
              >
                <IconTrash size={20} />
              </ActionIcon>
            </>
          )}
        </Group>
        
        {!recordingState.isRecording && recordingState.audioBlob && (
          <>
            <Group align="center">
              <Switch
                label={
                  <Group gap="xs">
                    {privacy === 'public' ? <IconWorldUpload size={16} /> : <IconLock size={16} />}
                    <Text size="sm">{privacy === 'public' ? 'Public (All players)' : 'Private (Active player only)'}</Text>
                  </Group>
                }
                checked={privacy === 'public'}
                onChange={(event) => setPrivacy(event.currentTarget.checked ? 'public' : 'private')}
              />
            </Group>
            
            <Group align="flex-right" gap="sm">
              <Button 
                variant="subtle" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleSend}
                loading={isUploading}
                leftSection={isUploading ? undefined : <IconWorldUpload size={16} />}
              >
                Send Message
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
}