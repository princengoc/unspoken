// src/core/game/types.ts
import { PLAYER_STATUS } from "./constants";

export type GamePhase = 'setup' | 'speaking' | 'endgame';
export type PlayerStatus = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type GameMode = 'irl' | 'remote';

// Core player state
export type Player = {
  id: string;
  username: string | null;
  isOnline: boolean;
  status: PlayerStatus;
  hasSpoken: boolean;
};

export const DEFAULT_PLAYER: Omit<Player, 'id' | 'username'> = {
  isOnline: true,   // Defaulting to online when joining
  status: PLAYER_STATUS.CHOOSING,
  hasSpoken: false,
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
  id: string;
  room_id: string;
  phase: GamePhase;
  currentRound: number;
  activePlayerId: string | null;
};

// Room without player info
export type Room = {
  id: string;
  passcode: string;
  created_by: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  game_mode: GameMode;
  game_state_id?: string;
  settings?: RoomSettings;
};

// Keep other existing types
export type RoomSettings = {
  allow_card_exchanges: boolean;
  allow_ripple_effects: boolean;
  rounds_per_player: number;
  card_selection_time: number;
  base_sharing_time: number;
  card_depth: 1 | 2 | 3 | null; // null means there is no depth restriction
};

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
}

// Utility functions remain the same
export const deduplicateCardsById = (cards: Card[]): Card[] => {
  const uniqueCards = new Map(cards.map(card => [card.id, card]));
  return Array.from(uniqueCards.values());
};

export const mergeCardsWithDeduplication = (existingCards: Card[], newCards: Card[]): Card[] => {
  const uniqueCards = new Map(
    [...existingCards, ...newCards].map(card => [card.id, card])
  );
  return Array.from(uniqueCards.values());
};

