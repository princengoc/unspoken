import { GameState, GameEvent, GameAction, Player } from './types';

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
      pendingExchanges: []
    };
  }

  private setState(newState: Partial<GameState>) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  subscribe(callback: (state: GameState) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  dispatch(event: GameEvent): GameAction[] {
    switch (event.type) {
      case 'START_GAME':
        if (this.state.phase !== 'setup') {
          throw new Error('Game can only be started from setup phase');
        }
        return this.handleStartGame();

      case 'DEAL_CARDS':
        if (this.state.phase !== 'setup') {
          throw new Error('Cards can only be dealt during setup');
        }
        return this.handleDealCards();

      case 'SELECT_CARD':
        if (this.state.phase !== 'setup') {
          throw new Error('Cards can only be selected during setup');
        }
        return this.handleSelectCard(event.playerId, event.cardId);

      case 'START_SHARING':
        if (this.state.phase !== 'speaking') {
          throw new Error('Sharing can only start during speaking phase');
        }
        return this.handleStartSharing();

      case 'END_SHARING':
        if (!this.state.isSpeakerSharing) {
          throw new Error('No active sharing to end');
        }
        return this.handleEndSharing();

      case 'PROPOSE_EXCHANGE':
        return this.handleProposeExchange(event.exchange);

      case 'RESPOND_TO_EXCHANGE':
        return this.handleRespondToExchange(event.exchangeId, event.accept);

      default:
        return [];
    }
  }

  public areAllPlayersSelected(): boolean {
    return this.state.players.every(p => p.hasSelected);
  }

  private handleStartGame(): GameAction[] {
    const allPlayersSelected = this.state.players.every(p => p.hasSelected);
    if (!allPlayersSelected) {
      console.log(`Players: ${JSON.stringify(this.state.players)}`);
      throw new Error('All players must select cards before starting');
    }

    this.setState({
      phase: 'speaking',
      activePlayerId: this.state.players[0].id
    });

    return [{ type: 'GAME_STARTED' }];
  }

  private handleDealCards(): GameAction[] {
    return [{ type: 'DEAL_CARDS_REQUESTED' }];
  }

  private handleSelectCard(playerId: string, cardId: string): GameAction[] {
    const playerIndex = this.state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error('Player not found');
    }

    const updatedPlayers = [...this.state.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hasSelected: true
    };

    this.setState({ players: updatedPlayers });

    return [{ 
      type: 'CARD_SELECTED',
      payload: { playerId, cardId }
    }];
  }

  private handleStartSharing(): GameAction[] {
    this.setState({
      phase: 'listening',
      isSpeakerSharing: true
    });

    return [{ type: 'SHARING_STARTED' }];
  }

  private handleEndSharing(): GameAction[] {
    const currentIndex = this.state.players.findIndex(
      p => p.id === this.state.activePlayerId
    );
    const nextIndex = (currentIndex + 1) % this.state.players.length;
    const nextPlayerId = this.state.players[nextIndex].id;

    this.setState({
      phase: 'speaking',
      activePlayerId: nextPlayerId,
      isSpeakerSharing: false
    });

    return [{ 
      type: 'SHARING_ENDED',
      payload: { nextPlayerId }
    }];
  }

  private handleProposeExchange(exchange: Omit<Exchange, 'id' | 'status'>): GameAction[] {
    const newExchange = {
      ...exchange,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const
    };

    this.setState({
      pendingExchanges: [...this.state.pendingExchanges, newExchange]
    });

    return [{ 
      type: 'EXCHANGE_PROPOSED',
      payload: { exchange: newExchange }
    }];
  }

  private handleRespondToExchange(exchangeId: string, accept: boolean): GameAction[] {
    const updatedExchanges = this.state.pendingExchanges.map(exchange =>
      exchange.id === exchangeId
        ? { ...exchange, status: accept ? 'accepted' : 'rejected' as const }
        : exchange
    );

    this.setState({ pendingExchanges: updatedExchanges });

    return [{
      type: 'EXCHANGE_RESPONDED',
      payload: { exchangeId, accepted: accept }
    }];
  }

  getState(): GameState {
    return this.state;
  }
}
