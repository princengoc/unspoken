// src/core/game/types.ts
export type GamePhase = "setup" | "speaking" | "endgame";
export type JoinRequestStatus = "pending" | "approved" | "rejected";
export type GameMode = "irl" | "remote";

export type SetupViewType = "cards" | "exchange";

export type DerivedPlayerStatus =
  | "drawing" // No cards in hand
  | "choosing" // Has cards but hasn't selected
  | "browsing" // Has selected card
  | "speaking" // Is active speaker
  | "listening" // Not active speaker during speaking phase
  | "done"; // Has spoken

// Core player state
export type Player = {
  id: string;
  username: string | null;
  is_online: boolean;
  has_spoken: boolean;
};

export const DEFAULT_PLAYER: Omit<Player, "id" | "username"> = {
  is_online: true, // Defaulting to online when joining
  has_spoken: false,
};

export type JoinRequest = {
  id: string;
  room_id: string;
  user_id: string;
  status: JoinRequestStatus;
  created_at: string;
  updated_at: string;
  handled_at: string | null;
  handled_by: string | null;
};

// Core game state without player info
export type GameState = {
  phase: GamePhase;
  active_player_id: string | null;
};

export type RoomMetadata = {
  id: string;
  passcode: string;
  created_by: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type RoomMetaDataAndState = RoomMetadata & GameState;

export type RoomSettings = {
  card_depth: 1 | 2 | 3 | null; // null means there is no depth restriction
  deal_extras: boolean; // If true, deal extra cards from cards table, otherwise, use ripples and exchanges only
  is_exchange: boolean; // If true, this is an exchange round. Auto-update by server
  game_mode: GameMode;
};

export type Room = RoomMetadata & RoomSettings & GameState;

export type Card = {
  id: string;
  content: string;
  category: string;
  depth: 1 | 2 | 3;
  created_at?: string;
  contributor_id?: string;
};

export type CardState = {
  roomPile: string[]; // all cards that have ever appeared, useful for dealing
  discardPile: string[]; // cards in discard state
  playerHands: Record<string, string[]>;
  selectedCards: Record<string, string>;
};

// Exchange types

export type MatchedExchange = {
  player1: string;
  player2: string;
  player1_card: string;
  player2_card: string;
};

export type ExchangeRequestStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "matched"
  | "auto-declined";
export type ExchangeRequestDirection = "incoming" | "outgoing";

export interface ExchangeRequest {
  id: string;
  room_id: string;
  from_id: string;
  to_id: string;
  card_id: string;
  status: ExchangeRequestStatus;
  created_at: string;
  updated_at: string;
}

// Enriched types: keep track of the other player relative to current user
// and the Card
export interface EnrichedExchangeRequest extends ExchangeRequest {
  otherPlayer?: {
    id: string;
    username: string | null;
  };
  card?: Card;
}
