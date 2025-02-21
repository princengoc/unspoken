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
  game_mode: GameMode;
  game_state_id?: string;
};

export type RoomSettings = {
  card_depth: 1 | 2 | 3 | null; // null means there is no depth restriction
  deal_extras: boolean; // If true, deal extra cards from cards table, otherwise, use ripples and exchanges only
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
}

// Exchange types

export type MatchedExchange = {
  player1: string; 
  player2: string;
  player1_card: string; 
  player2_card: string;
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

// Functions to deconstruct a room
export function extractMetadata(room: Room): RoomMetadata {
  const { id, passcode, created_by, name, created_at, updated_at, is_active, game_mode } = room;
  return { id, passcode, created_by, name, created_at, updated_at, is_active, game_mode };
}

export function extractGameState(room: Room): GameState {
  const { phase, active_player_id } = room;
  return { phase, active_player_id };
}
