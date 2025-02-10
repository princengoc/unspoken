import { GameState } from './types';
import { ERRORS } from './constants';
import { GameEvent } from './actions';

export function gameReducer(state: GameState, event: GameEvent): GameState {
  const safeCardsInPlay = state.cardsInPlay ?? [];
  switch (event.type) {
    case 'PHASE_CHANGED':
      return {
        ...state,
        phase: event.phase
      };

    case 'ACTIVE_PLAYER_CHANGED':
      return {
        ...state,
        activePlayerId: event.playerId
      };

    case 'START_GAME':
      if (state.phase !== 'setup') {
        throw new Error(ERRORS.INVALID_PHASE);
      }
      if (!state.players.every(p => p.hasSelected)) {
        throw new Error('All players must select cards before starting');
      }
      return {
        ...state,
        phase: 'speaking',
        activePlayerId: state.players[0].id
      };

    case 'DEAL_CARDS':
      if (state.phase !== 'setup') {
        throw new Error(ERRORS.INVALID_PHASE);
      }
      return state; // Actual dealing handled by hook

    case 'SELECT_CARD':
      if (state.phase !== 'setup') {
        throw new Error(ERRORS.INVALID_PHASE);
      }
      const selectedCard = state.playerHands[event.playerId]?.find(card => card.id === event.cardId);
      if (!selectedCard) {
        throw new Error(`Card not found in player hand. State: ${JSON.stringify(state)} \n Event: ${JSON.stringify(event)}`);
      }
      // Use the same deduplication logic here for CARDS_SELECTED
      const uniqueCardsAfterSelection = new Map(
        [...safeCardsInPlay, selectedCard].map(card => [card.id, card])
      );
      
      return {
        ...state,
        players: state.players.map(p =>
          p.id === event.playerId
            ? { ...p, hasSelected: true }
            : p
        ),
        cardsInPlay: Array.from(uniqueCardsAfterSelection.values()),
        playerHands: {
          ...state.playerHands,
          [event.playerId]: state.playerHands[event.playerId].filter(card => card.id !== event.cardId)
        }
      };

    case 'START_SHARING':
      if (state.phase !== 'speaking') {
        throw new Error(ERRORS.INVALID_PHASE);
      }
      return {
        ...state,
        phase: 'listening',
        isSpeakerSharing: true
      };

    case 'END_SHARING':
      if (!state.isSpeakerSharing) {
        throw new Error('No active sharing to end');
      }
      const currentIndex = state.players.findIndex(
        p => p.id === state.activePlayerId
      );
      const nextIndex = (currentIndex + 1) % state.players.length;
      
      return {
        ...state,
        phase: 'speaking',
        activePlayerId: state.players[nextIndex].id,
        isSpeakerSharing: false
      };

    case 'CARDS_DEALT':
      return {
        ...state,
        playerHands: {
          ...state.playerHands,
          [event.playerId]: event.cards
        }
      };

      case 'CARDS_SELECTED':
        // Use Map to ensure uniqueness by card ID
        const uniqueCards = new Map(
          [...safeCardsInPlay, ...event.cards].map(card => [card.id, card])
        );
        return {
          ...state,
          cardsInPlay: Array.from(uniqueCards.values())
        };

    case 'EXCHANGE_PROPOSED':
      return {
        ...state,
        pendingExchanges: [
          ...state.pendingExchanges,
          {
            ...event.exchange,
            status: 'pending'
          }
        ]
      };

    case 'EXCHANGE_RESPONDED':
      return {
        ...state,
        pendingExchanges: state.pendingExchanges.map(exchange =>
          exchange.id === event.exchangeId
            ? { ...exchange, status: event.accepted ? 'accepted' : 'rejected' }
            : exchange
        )
      };

    default:
      return state;
  }
}