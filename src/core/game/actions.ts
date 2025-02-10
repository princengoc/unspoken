import { GamePhase, Card, Exchange } from './types';

// Action creators
export const gameActions = {
  phaseChanged: (phase: GamePhase) => ({
    type: 'PHASE_CHANGED' as const,
    phase
  }),

  activePlayerChanged: (playerId: string) => ({
    type: 'ACTIVE_PLAYER_CHANGED' as const,
    playerId
  }),

  startGame: () => ({
    type: 'START_GAME' as const
  }),

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

  startSharing: () => ({
    type: 'START_SHARING' as const
  }),

  endSharing: () => ({
    type: 'END_SHARING' as const
  }),

  proposeExchange: (exchange: Omit<Exchange, 'status'>) => ({
    type: 'EXCHANGE_PROPOSED' as const,
    exchange
  }),

  respondToExchange: (exchangeId: string, accepted: boolean) => ({
    type: 'EXCHANGE_RESPONDED' as const,
    exchangeId,
    accepted
  })
};

// Infer action types from action creators
type ActionCreators = typeof gameActions;
type ActionCreatorReturnTypes = {
  [K in keyof ActionCreators]: ReturnType<ActionCreators[K]>
};
export type GameEvent = ActionCreatorReturnTypes[keyof ActionCreators];