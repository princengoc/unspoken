import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AudioMessage, AudioPrivacy } from "@/core/audio/types";
import { audioMessagesService } from "@/services/supabase/audio-messages";
import { useAuth } from "./AuthProvider";

interface AudioMessagesContextType {
  // State
  messages: AudioMessage[];
  loading: boolean;
  recording: boolean;

  // Actions
  sendAudioMessage: (
    audioBlob: Blob,
    privacy: AudioPrivacy,
    targetPlayerId?: string,
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
  children: ReactNode;
}

export function AudioMessagesProvider({
  roomId,
  children,
}: AudioMessagesProviderProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AudioMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!user?.id || !roomId) return;

    setLoading(true);

    // Subscribe to messages already has an initial fetch with call back
    const subscription = audioMessagesService.subscribeToAudioMessages(
      roomId,
      user.id,
      (updatedMessages) => {
        setMessages(updatedMessages);
        setLoading(false);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, user?.id]);

  const sendAudioMessage = async (
    audioBlob: Blob,
    privacy: AudioPrivacy,
    targetPlayerId?: string,
  ) => {
    if (!user?.id) return null;

    try {
      return await audioMessagesService.uploadAudioMessage(
        roomId,
        user.id,
        audioBlob,
        privacy,
        targetPlayerId,
      );
    } catch (error) {
      console.error("Error sending audio message:", error);
      return null;
    }
  };

  const markAsListened = async (messageId: string) => {
    if (!user?.id) return false;

    try {
      const success = await audioMessagesService.markMessageAsListened(
        messageId,
        user.id,
      );
      console.log(`Success after mark as listened clicked: ${success}`);
      if (success) {
        // Remove from local state immediately for a responsive UI
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
      return success;
    } catch (error) {
      console.error("Error marking message as listened:", error);
      return false;
    }
  };

  const getAudioUrl = async (filePath: string) => {
    return audioMessagesService.getAudioMessageUrl(filePath);
  };

  const refreshMessages = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const availableMessages =
        await audioMessagesService.getAvailableAudioMessages(roomId, user.id);
      setMessages(availableMessages);
    } catch (error) {
      console.error("Error refreshing audio messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    messages,
    loading,
    recording,
    sendAudioMessage,
    markAsListened,
    getAudioUrl,
    refreshMessages,
    setRecording,
  };

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
