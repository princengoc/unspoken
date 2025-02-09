export type Card = {
  id: string;
  content: string;
  category: string;
  depth: 1 | 2 | 3;
  created_at?: string;
  contributor_id?: string;
}

export type GameSession = {
  id: string;
  current_phase: 'setup' | 'speaking' | 'listening';
  active_player_id: string;
  room_id?: string;
  created_at: string;
  cards_in_play: string[];  // Card IDs
  discard_pile: string[];   // Card IDs
  player_hands: Record<string, string[]>;  // userId -> array of card IDs
  players: Array<{
    id: string;
    username: string | null;
    isOnline: boolean;
  }>;
}

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
  players: RoomPlayer[];
  settings?: RoomSettings;
}

export type RoomPlayer = {
  id: string;
  username: string | null;
  joined_at: string;
  is_active: boolean;
  last_seen_at: string;
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