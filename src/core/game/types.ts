// src/core/game/types.ts
import { PLAYER_STATUS } from "./constants";

export type GamePhase = 'setup' | 'speaking';
export type PlayerStatus = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type GameMode = 'irl' | 'remote';

// Core player state
export type Player = {
  id: string;
  username: string | null;
  isOnline: boolean;
  status: PlayerStatus;
  selectedCard?: string | null;
  hasSpoken: boolean;
  speakOrder?: number;
  playerHand?: Card[];  // Added this from PlayerState
};

// Database schema related types
export type RoomMember = Omit<Player, 'id'> & {
  room_id: string;
  user_id: string;  // This is the id field from Player
  joined_at: string;
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
  cardsInPlay: Card[]; // cards that will be excluded from dealing because it is already in play
  discardPile: Card[]; // cards discard by players in this game
  currentRound: number;
  totalRounds: number;
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
};

export type Card = {
  id: string;
  content: string;
  category: string;
  depth: 1 | 2 | 3;
  created_at?: string;
  contributor_id?: string;
};

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

export function hasSelected(player: Player): boolean {
  return player.status !== PLAYER_STATUS.CHOOSING && player.selectedCard != null;
}