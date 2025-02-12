// src/core/game/reducers.ts
import { GameState, Player, PlayerStatus, Card, deduplicateCardsById } from './types';
import { ERRORS, PLAYER_STATUS } from './constants';
import { GameEvent } from './actions';

const updatePlayer = (players: Player[], playerId: string, updates: Partial<Player>): Player[] => {
  return players.map(player =>
    player.id === playerId ? { ...player, ...updates } : player
  );
};

export function gameReducer(state: GameState, event: GameEvent): GameState {
  const safeCardsInPlay = state.cardsInPlay ?? [];
  
  switch (event.type) {
    case 'PHASE_CHANGED':
      return {
        ...state,
        phase: event.phase
      };

    case 'PLAYER_STATUS_CHANGED': {
      // Validate status transitions
      const player = state.players.find(p => p.id === event.playerId);
      if (!player) throw new Error(ERRORS.INVALID_PLAYER);

      // Define valid transitions
      const validTransitions: Record<string, PlayerStatus[]> = {
        [PLAYER_STATUS.CHOOSING]: [PLAYER_STATUS.BROWSING, PLAYER_STATUS.CHOOSING],
        [PLAYER_STATUS.BROWSING]: [PLAYER_STATUS.SPEAKING, PLAYER_STATUS.LISTENING],
        [PLAYER_STATUS.SPEAKING]: [PLAYER_STATUS.LISTENING],
        [PLAYER_STATUS.LISTENING]: [PLAYER_STATUS.SPEAKING],
      };

      const validNextStates = validTransitions[player.status];
      if (!validNextStates?.includes(event.status)) {
        console.log(`player.status: ${JSON.stringify(player.status)}`);
        console.log(`event.status: ${JSON.stringify(event.status)}`);
        console.log(`event: ${JSON.stringify(event)}`);
        console.log(`player: ${JSON.stringify(player)}`);
        throw new Error(ERRORS.INVALID_STATUS);
      }

      return {
        ...state,
        players: updatePlayer(state.players, event.playerId, { status: event.status })
      };
    }

    case 'DEAL_CARDS':
      if (state.phase !== 'setup') {
        throw new Error(ERRORS.INVALID_PHASE);
      }
      return state; // Actual dealing handled by hook

    case 'CARDS_DEALT':
      return {
        ...state,
        playerHands: {
          ...state.playerHands,
          [event.playerId]: event.cards
        }
      };

    case 'SELECT_CARD': {
      if (state.phase !== 'setup') {
        throw new Error(ERRORS.INVALID_PHASE);
      }

      const player = state.players.find(p => p.id === event.playerId);
      if (!player) throw new Error(ERRORS.INVALID_PLAYER);

      const selectedCard = state.playerHands[event.playerId]?.find(card => card.id === event.cardId);
      if (!selectedCard) throw new Error(ERRORS.INVALID_CARD);

      // Remove selected card from hand and add to cardsInPlay
      const uniqueCardsAfterSelection = deduplicateCardsById([...safeCardsInPlay, selectedCard]);

      // Move unselected cards to discard pile
      const unselectedCards = state.playerHands[event.playerId]
        .filter(card => card.id !== event.cardId);

      return {
        ...state,
        players: updatePlayer(state.players, event.playerId, { 
          selectedCard: event.cardId,
          status: PLAYER_STATUS.BROWSING 
        }),
        cardsInPlay: uniqueCardsAfterSelection,
        discardPile: [...state.discardPile, ...unselectedCards],
        playerHands: {
          ...state.playerHands,
          [event.playerId]: []  // Clear hand after selection
        }
      };
    }

    case 'COMPLETE_SETUP': {
      const updatedPlayers = updatePlayer(state.players, event.playerId, {
        speakOrder: event.speakOrder
      });

      // If all players have completed setup, transition to speaking phase
      const allPlayersComplete = updatedPlayers.every(p => p.speakOrder !== undefined);
      
      return {
        ...state,
        phase: allPlayersComplete ? 'speaking' : state.phase,
        players: updatedPlayers,
        // Set first speaker if transitioning to speaking phase
        activePlayerId: allPlayersComplete ? 
          updatedPlayers.find(p => p.speakOrder === 1)?.id || null : 
          state.activePlayerId
      };
    }

    case 'START_SPEAKING': {
      if (state.phase !== 'speaking') throw new Error(ERRORS.INVALID_PHASE);
      if (state.activePlayerId !== event.playerId) throw new Error(ERRORS.INVALID_PLAYER);

      return {
        ...state,
        players: state.players.map(p => ({
          ...p,
          status: p.id === event.playerId ? 
            PLAYER_STATUS.SPEAKING : 
            PLAYER_STATUS.LISTENING
        })),
        isSpeakerSharing: true
      };
    }

    case 'FINISH_SPEAKING': {
      if (!state.isSpeakerSharing) throw new Error('No active sharing to end');

      const currentSpeaker = state.players.find(p => p.id === event.playerId);
      if (!currentSpeaker) throw new Error(ERRORS.INVALID_PLAYER);

      // Mark current speaker as having spoken
      const updatedPlayers = updatePlayer(state.players, event.playerId, {
        hasSpoken: true,
        status: PLAYER_STATUS.LISTENING
      });

      // Find next speaker (next in speakOrder who hasn't spoken)
      const nextSpeaker = updatedPlayers
        .filter(p => !p.hasSpoken)
        .sort((a, b) => (a.speakOrder || 0) - (b.speakOrder || 0))[0];

      // If no next speaker, round is complete
      const roundComplete = !nextSpeaker;

      return {
        ...state,
        players: updatedPlayers,
        activePlayerId: nextSpeaker?.id || null,
        isSpeakerSharing: false,
        phase: roundComplete ? 'setup' : 'speaking',
        currentRound: roundComplete ? state.currentRound + 1 : state.currentRound,
        // Reset player states if round is complete
        ...(roundComplete
          ? {
              players: updatedPlayers.map(p => ({
                ...p,
                hasSpoken: false,
                selectedCard: undefined,
                speakOrder: undefined,
                status: PLAYER_STATUS.CHOOSING
              }))
            }
          : {}
        )
      };
    }

    case 'MOVE_TO_DISCARD_PILE': {
      const cardsToDiscard = state.cardsInPlay
        .filter(card => event.cardIds.includes(card.id));
      
      return {
        ...state,
        cardsInPlay: state.cardsInPlay
          .filter(card => !event.cardIds.includes(card.id)),
        discardPile: [...state.discardPile, ...cardsToDiscard]
      };
    }

    default:
      return state;
  }
}