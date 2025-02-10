// Core game types
export type GamePhase = 'setup' | 'speaking' | 'listening';

export type Player = {
  id: string;
  username: string | null;
  isOnline: boolean;
  hasSelected?: boolean;
};

export type GameState = {
  id: string;
  room_id: string;
  phase: GamePhase;
  activePlayerId: string | null;
  players: Player[];
  cardsInPlay: Card[];
  discardPile: Card[];
  isSpeakerSharing: boolean;
  pendingExchanges: Exchange[];
  playerHands: Record<string, Card[]>;
};

export type Exchange = {
  id: string;
  session_id: string;
  requester_id: string;
  recipient_id: string;
  offered_card_id: string;
  requested_card_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export type GameAction = {
  type: string;
  payload?: any;
};

export type GameConfig = {
  allowExchanges: boolean;
  allowRipples: boolean;
  roundsPerPlayer: number;
  cardSelectionTime: number;
  baseSharingTime: number;
};


export type Card = {
  id: string;
  content: string;
  category: string;
  depth: 1 | 2 | 3;
  created_at?: string;
  contributor_id?: string;
}

export type Room = {
  id: string;
  passcode: string;
  created_by: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  game_mode: 'irl' | 'remote';
  current_session_id?: string;
  players: Player[];
  settings?: RoomSettings;
}

export type RoomSettings = {
  allow_card_exchanges: boolean;
  allow_ripple_effects: boolean;
  rounds_per_player: number;
  card_selection_time: number;  // in seconds
  base_sharing_time: number;    // in seconds
}

export type RoomInvite = {
  id: string;
  room_id: string;
  passcode: string;
  created_at: string;
  expires_at: string;
  created_by: string;
  is_valid: boolean;
}