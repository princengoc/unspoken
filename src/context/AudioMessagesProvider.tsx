// src/context/AudioMessagesProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { AudioMessage, AudioPrivacy } from "@/core/audio/types";
import { audioMessagesService } from "@/services/supabase/audio-messages";

interface AudioMessagesContextType {
  // State
  messages: AudioMessage[];
  messagesByCard: Map<string, AudioMessage[]>; // New organization by card_id
  loading: boolean;
  recording: boolean;

  // Actions
  sendAudioMessage: (
    audioBlob: Blob,
    privacy: AudioPrivacy,
    targetPlayerId?: string,
    cardId?: string,
  ) => Promise<AudioMessage | null>;
  markAsListened: (messageId: string) => Promise<boolean>;
  getAudioUrl: (
    filePath: string,
  ) => Promise<{ url: string; expiresIn: number } | null>;
  refreshMessages: () => Promise<void>;
  setRecording: (isRecording: boolean) => void;
}

type AudioUrlCache = {
  url: string;
  expiresAt: number; // Timestamp when URL expires
};

const AudioMessagesContext = createContext<AudioMessagesContextType | null>(
  null,
);

interface AudioMessagesProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

export function AudioMessagesProvider({
  roomId,
  userId,
  children,
}: AudioMessagesProviderProps) {
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [urlCache, setUrlCache] = useState<Record<string, AudioUrlCache>>({});

  // Group messages by card ID
  const messagesByCard = useMemo(() => {
    const grouped = new Map<string, AudioMessage[]>();

    messages.forEach((message) => {
      // Ensure all messages have a card_id
      const cardId = message.card_id;

      if (cardId) {
        if (!grouped.has(cardId)) {
          grouped.set(cardId, []);
        }
        grouped.get(cardId)!.push(message);
      }
    });

    return grouped;
  }, [messages]);

  useEffect(() => {
    setLoading(true);
    // Subscribe to messages already has an initial fetch with call back
    const subscription = audioMessagesService.subscribeToAudioMessages(
      roomId,
      userId,
      (updatedMessages) => {
        setMessages(updatedMessages);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, userId]);

  const sendAudioMessage = useCallback(
    async (
      audioBlob: Blob,
      privacy: AudioPrivacy,
      targetPlayerId?: string,
      cardId?: string,
    ) => {
      try {
        return await audioMessagesService.uploadAudioMessage(
          roomId,
          userId,
          audioBlob,
          privacy,
          targetPlayerId,
          cardId,
        );
      } catch (error) {
        console.error("Error sending audio message:", error);
        return null;
      }
    },
    [roomId, userId],
  );

  const refreshMessages = useCallback(async () => {
    setLoading(true);
    try {
      const availableMessages =
        await audioMessagesService.getAvailableAudioMessages(roomId, userId);
      setMessages(availableMessages);
    } catch (error) {
      console.error("Error refreshing audio messages:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, userId]);

  const markAsListened = useCallback(
    async (messageId: string) => {
      try {
        // Optimistically update UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId));

        const success = await audioMessagesService.markMessageAsListened(
          messageId,
          userId,
        );

        console.log(`Success after mark as listened clicked: ${success}`);
        return success;
      } catch (error) {
        console.error("Error marking message as listened:", error);
        // On error, refresh to get the correct state
        await refreshMessages();
        return false;
      }
    },
    [userId, refreshMessages],
  );

  const getAudioUrl = useCallback(
    async (filePath: string) => {
      // Check if we have a valid cached URL
      const cached = urlCache[filePath];
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        // If URL is still valid, return it
        return {
          url: cached.url,
          expiresIn: Math.floor((cached.expiresAt - now) / 1000),
        };
      }

      try {
        // If not in cache or expired, fetch new URL
        const result = await audioMessagesService.getAudioMessageUrl(filePath);

        if (result?.url) {
          // Cache the URL with expiration time
          const expiresAt = now + result.expiresIn * 1000;
          setUrlCache((prev) => ({
            ...prev,
            [filePath]: { url: result.url, expiresAt },
          }));
          return result;
        }
        return null;
      } catch (err) {
        console.error("Error getting audio URL:", err);
        return null;
      }
    },
    [urlCache],
  );

  // memoize the value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      messages,
      messagesByCard,
      loading,
      recording,
      sendAudioMessage,
      markAsListened,
      refreshMessages,
      setRecording,
      getAudioUrl,
    };
  }, [
    messages,
    messagesByCard,
    loading,
    recording,
    sendAudioMessage,
    markAsListened,
    refreshMessages,
    setRecording,
    getAudioUrl,
  ]);

  return (
    <AudioMessagesContext.Provider value={value}>
      {children}
    </AudioMessagesContext.Provider>
  );
}

export function useAudioMessages() {
  const context = useContext(AudioMessagesContext);
  if (!context) {
    throw new Error(
      "useAudioMessages must be used within an AudioMessagesProvider",
    );
  }
  return context;
}
