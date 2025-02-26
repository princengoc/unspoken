export interface AudioMessage {
  id: string;
  room_id: string;
  sender_id: string;
  file_path: string;
  is_public: boolean;
  receiver_id: string | null;
  created_at: string;
  expires_at: string;
}

export interface AudioMessageAccess {
  id: string;
  message_id: string;
  user_id: string;
  accessed_at: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasListened: boolean;
}

export type AudioPrivacy = "public" | "private";
