import { useEffect } from 'react';
import { exchangesService, gameStatesService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';



export function useGameSync(sessionId: string | null) {
  const stateMachine = useGameState();

  useEffect(() => {
    if (!sessionId) return;

    const subscription = gameStatesService.subscribeToChanges(sessionId, async (session) => {
      const currentState = stateMachine.getState();

      // Sync phase changes
      if (session.phase !== currentState.phase) {
        stateMachine.dispatch(gameActions.phaseChanged(session.phase));
      }

      // Handle active player changes, allowing null values
      if (session.activePlayerId !== currentState.activePlayerId) {
        stateMachine.dispatch(gameActions.activePlayerChanged(session.activePlayerId));
      }

      // Sync cards in play
      if (session.cardsInPlay) {
        stateMachine.dispatch(gameActions.cardsSelected(session.cardsInPlay));
      }

      // Sync player hands
      if (session.playerHands) {
        for (const [playerId, cards] of Object.entries(session.playerHands)) {
          stateMachine.dispatch(gameActions.cardsDealt(playerId, cards));
        }
      }
    });

    // Subscribe to exchanges and handle updates
    const exchangeSubscription = exchangesService.subscribeToChanges(sessionId, (exchanges) => {
      // Update state machine with new exchanges
      exchanges.forEach(exchange => {
        if (exchange.status === 'pending') {
          stateMachine.dispatch(gameActions.proposeExchange(exchange));
        } else {
          stateMachine.dispatch(gameActions.respondToExchange(
            exchange.id, 
            exchange.status === 'accepted'
          ));
        }
      });
    });

    return () => {
      subscription.unsubscribe();
      exchangeSubscription.unsubscribe();
    };
  }, [sessionId, stateMachine]);
}