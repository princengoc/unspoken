import { GameState, Player } from './types';
import { GameEvent } from './actions';
import { gameReducer } from './reducers';

export class GameStateMachine {
  private state: GameState;
  private subscribers: ((state: GameState) => void)[] = [];

  constructor(initialPlayers: Player[]) {
    this.state = {
      phase: 'setup',
      activePlayerId: initialPlayers[0]?.id || null,
      players: initialPlayers,
      cardsInPlay: [],
      discardPile: [],
      isSpeakerSharing: false,
      pendingExchanges: [],
      playerHands: {}
    };
  }

  getState(): GameState {
    return this.state;
  }

  dispatch(event: GameEvent): void {
    // Apply the event to produce new state
    const newState = gameReducer(this.state, event);
    
    // Update state and notify subscribers
    this.state = newState;
    this.notifySubscribers();
  }

  subscribe(callback: (state: GameState) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Utility methods for state queries
  areAllPlayersSelected(): boolean {
    return this.state.players.every(p => p.hasSelected);
  }

  isValidTransition(event: GameEvent): boolean {
    try {
      gameReducer(this.state, event);
      return true;
    } catch {
      return false;
    }
  }
}