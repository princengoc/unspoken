export interface AudioMessage {
  id: string;
  room_id: string;
  sender_id: string;
  file_path: string;
  is_public: boolean;
  receiver_id: string | null;
  created_at: string;
  expires_at: string;
  card_id: string | null;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
  initializing?: boolean;
}

export type AudioPrivacy = "public" | "private";
