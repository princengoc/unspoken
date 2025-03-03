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

  // memoize the value to prevent unnecessary re-renders
  const value = useMemo(() => {
    const getAudioUrl = async (filePath: string) => {
      return audioMessagesService.getAudioMessageUrl(filePath);
    };

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
