import React, { useState, useEffect, useRef } from 'react';
import { AudioMessage } from '@/core/audio/types';
import { getAudioMessageUrl } from '@/services/supabase/audio-messages';

interface AudioPlayerProps {
  message: AudioMessage;
  userId: string;
  onListened?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  message,
  userId,
  onListened,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasListened, setHasListened] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const expirationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Load the audio URL
  useEffect(() => {
    const loadAudio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Loading audio URL for message:', message.id);
        const result = await getAudioMessageUrl(message.id, message.filePath, userId);
        console.log('Audio URL result:', result);
        
        if (result && result.url) {
          setAudioUrl(result.url);
          setExpiresIn(result.expiresIn);
          
          // Set a timeout to clear the URL when it expires
          if (expirationTimeout.current) {
            clearTimeout(expirationTimeout.current);
          }
          
          expirationTimeout.current = setTimeout(() => {
            setAudioUrl(null);
            setError('The audio message has expired.');
          }, result.expiresIn * 1000);
        } else {
          setError('Failed to load audio message.');
        }
      } catch (err) {
        console.error('Error loading audio message:', err);
        setError('An error occurred while loading the audio message.');
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
      
      if (expirationTimeout.current) {
        clearTimeout(expirationTimeout.current);
      }
    };
  }, [message.id, message.filePath, userId]);
  
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
    
    // No longer automatically marking as listened
    // This will be done via the explicit "Mark as Done" button
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };
    
    const handleError = (e) => {
      console.error('Audio playback error:', e);
      setError('Error playing audio. Please try again.');
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl, onListened]);
  
  // Update audio source when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      // Reset player state when URL changes
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      
      // Load the new URL
      audioRef.current.load();
    }
  }, [audioUrl]);
  
  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate expiration time remaining
  const getExpirationText = (): string => {
    if (!expiresIn) return '';
    
    const minutes = Math.floor(expiresIn / 60);
    const seconds = expiresIn % 60;
    
    return minutes > 0
      ? `Expires in ${minutes}m ${seconds}s`
      : `Expires in ${seconds}s`;
  };
  
  const handlePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !audioUrl) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-md">
      <h3 className="text-lg font-semibold mb-2">Audio Message</h3>
      
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      ) : (
        <>
          <audio 
            ref={audioRef} 
            src={audioUrl || undefined} 
            preload="metadata"
            crossOrigin="anonymous"
          />
          
          <div className="mb-2 text-xs text-gray-500 flex justify-between">
            <span>From: {message.senderId}</span>
            <span>{message.isPublic ? 'Public' : 'Private'}</span>
          </div>
          
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={handlePlayPause}
              className={`rounded-full p-2 text-white ${
                isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={!audioUrl}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                disabled={!audioUrl}
              />
            </div>
            
            <div className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          {expiresIn !== null && (
            <div className="text-xs text-red-500 text-right mt-1">
              {getExpirationText()}
            </div>
          )}
          
          {hasListened && (
            <div className="text-xs text-green-500 mt-1">
              Message marked as listened
            </div>
          )}
        </>
      )}
    </div>
  );
};