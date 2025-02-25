export interface AudioMessage {
    id: string;
    roomId: string;
    senderId: string;
    filePath: string;
    isPublic: boolean;
    createdAt: string;
    expiresAt: string;
  }
  
  export interface AudioMessageAccess {
    id: string;
    messageId: string;
    userId: string;
    accessedAt: string;
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
  
  export type AudioPrivacy = 'public' | 'private';