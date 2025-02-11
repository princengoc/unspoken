// src/core/game/actions.ts

import { GamePhase, Card, PlayerStatus } from './types';

export const gameActions = {
  // Phase changes
  phaseChanged: (phase: GamePhase) => ({
    type: 'PHASE_CHANGED' as const,
    phase
  }),

  // Player status changes
  playerStatusChanged: (playerId: string, status: PlayerStatus) => ({
    type: 'PLAYER_STATUS_CHANGED' as const,
    playerId,
    status
  }),

  // Card management
  dealCards: () => ({
    type: 'DEAL_CARDS' as const
  }),

  cardsDealt: (playerId: string, cards: Card[]) => ({
    type: 'CARDS_DEALT' as const,
    playerId,
    cards
  }),

  selectCard: (playerId: string, cardId: string) => ({
    type: 'SELECT_CARD' as const,
    playerId,
    cardId
  }),

  cardsSelected: (cards: Card[]) => ({
    type: 'CARDS_SELECTED' as const,
    cards
  }),

  // Setup completion
  completeSetup: (playerId: string, speakOrder: number) => ({
    type: 'COMPLETE_SETUP' as const,
    playerId,
    speakOrder
  }),

  // Speaking management
  startSpeaking: (playerId: string) => ({
    type: 'START_SPEAKING' as const,
    playerId
  }),

  finishSpeaking: (playerId: string) => ({
    type: 'FINISH_SPEAKING' as const,
    playerId
  }),

  // Round management
  completeRound: () => ({
    type: 'COMPLETE_ROUND' as const
  }),

  startNewRound: () => ({
    type: 'START_NEW_ROUND' as const
  }),

  // Player tracking
  updateSpeakOrder: (speakOrder: Record<string, number>) => ({
    type: 'UPDATE_SPEAK_ORDER' as const,
    speakOrder
  }),

  setActivePlayer: (playerId: string | null) => ({
    type: 'SET_ACTIVE_PLAYER' as const,
    playerId
  }),

  // Discard pile management
  moveToDiscardPile: (cardIds: string[]) => ({
    type: 'MOVE_TO_DISCARD_PILE' as const,
    cardIds
  })
};

// Infer action types from action creators
type ActionCreators = typeof gameActions;
type ActionCreatorReturnTypes = {
  [K in keyof ActionCreators]: ReturnType<ActionCreators[K]>
};
export type GameEvent = ActionCreatorReturnTypes[keyof ActionCreators];