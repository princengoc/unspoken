import React, { useState } from 'react';
import { useAudioRecording } from '@/hooks/audio/useAudioRecording';
import { uploadAudioMessage } from '@/services/supabase/audio-messages';
import { AudioPrivacy } from '@/core/audio/types';

interface AudioRecorderProps {
  userId: string;
  roomId: string;
  onMessageSent?: () => void;
  onCancel?: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  userId,
  roomId,
  onMessageSent,
  onCancel,
}) => {
  const {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecording();
  
  const [privacy, setPrivacy] = useState<AudioPrivacy>('private');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handlePrivacyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrivacy(event.target.checked ? 'public' : 'private');
  };
  
  const handleCancel = () => {
    resetRecording();
    setError(null);
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
      
      const result = await uploadAudioMessage(
        roomId,
        userId,
        recordingState.audioBlob,
        privacy
      );
      
      if (result) {
        resetRecording();
        onMessageSent?.();
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
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-4">Record Audio Message</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-center mb-4">
        <div className="text-3xl font-mono">
          {formatTime(recordingState.duration)}
        </div>
        
        {recordingState.duration > 0 && recordingState.duration < 300 && (
          <div className="text-sm text-gray-500 ml-2">
            {formatTime(300 - recordingState.duration)} remaining
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4 mb-6">
        {!recordingState.isRecording && !recordingState.audioBlob && (
          <button
            onClick={startRecording}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
            aria-label="Start recording"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <circle cx="12" cy="12" r="6" />
            </svg>
          </button>
        )}
        
        {recordingState.isRecording && !recordingState.isPaused && (
          <>
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-4"
              aria-label="Pause recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            </button>
            
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
              aria-label="Stop recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          </>
        )}
        
        {recordingState.isRecording && recordingState.isPaused && (
          <>
            <button
              onClick={resumeRecording}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4"
              aria-label="Resume recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
            
            <button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4"
              aria-label="Stop recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <rect x="6" y="6" width="12" height="12" />
              </svg>
            </button>
          </>
        )}
        
        {!recordingState.isRecording && recordingState.audioBlob && (
          <>
            <button
              onClick={() => {
                if (recordingState.audioUrl) {
                  const audio = new Audio(recordingState.audioUrl);
                  audio.play();
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4"
              aria-label="Play recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </button>
            
            <button
              onClick={resetRecording}
              className="bg-gray-500 hover:bg-gray-600 text-white rounded-full p-4"
              aria-label="Reset recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {!recordingState.isRecording && recordingState.audioBlob && (
        <>
          <div className="flex items-center justify-between mb-4">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={privacy === 'public'}
                onChange={handlePrivacyChange}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {privacy === 'public' ? 'Public (All players)' : 'Private (Active player only)'}
              </span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isUploading}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};