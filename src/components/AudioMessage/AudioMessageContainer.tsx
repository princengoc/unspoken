import React, { useState, useEffect } from 'react';
import { AudioRecorder, AudioPlayer } from '.';
import { getAvailableAudioMessages, markMessageAsListened } from '@/services/supabase/audio-messages';
import { AudioMessage } from '@/core/audio/types';

interface AudioMessageContainerProps {
  userId: string;
  roomId: string;
}

export const AudioMessageContainer: React.FC<AudioMessageContainerProps> = ({
  userId,
  roomId,
}) => {
  const [showRecorder, setShowRecorder] = useState(false);
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load available messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading messages for room:', roomId, 'user:', userId);
      const availableMessages = await getAvailableAudioMessages(roomId, userId);
      console.log('Available messages:', availableMessages);
      setMessages(availableMessages);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load audio messages.');
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load on component mount
  useEffect(() => {
    // Load messages once on initial render
    loadMessages();
  }, []);
  
  // Handle message listened
  const handleMessageListened = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );
  };
  
  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Audio Messages</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={loadMessages}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
            disabled={loading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
            {loading ? 'Loading...' : 'Check Messages'}
          </button>
          
          <button
            onClick={() => setShowRecorder(!showRecorder)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            {showRecorder ? 'Cancel' : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 mr-1"
                >
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                Record Message
              </>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      {showRecorder && (
        <div className="mb-4">
          <AudioRecorder
            userId={userId}
            roomId={roomId}
            onMessageSent={() => {
              setShowRecorder(false);
              loadMessages();
            }}
            onCancel={() => setShowRecorder(false)}
          />
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="border rounded-lg overflow-hidden">
              <AudioPlayer
                message={message}
                userId={userId}
                onListened={() => handleMessageListened(message.id)}
              />
              <div className="p-3 bg-gray-50 border-t">
                <button
                  onClick={() => {
                    markMessageAsListened(message.id, userId).then(success => {
                      if (success) {
                        handleMessageListened(message.id);
                        // Refresh the message list
                        loadMessages();
                      }
                    });
                  }}
                  className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Mark as Done
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No audio messages available.
        </div>
      )}
    </div>
  );
};