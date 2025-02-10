import { useEffect } from 'react';
import { exchangesService, sessionsService } from '@/services/supabase/gameStates';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';

export function useGameSync(sessionId: string | null) {
  const stateMachine = useGameState();

  useEffect(() => {
    if (!sessionId) return;

    const subscription = sessionsService.subscribeToChanges(sessionId, async (session) => {
      const currentState = stateMachine.getState();

      // Sync phase changes
      if (session.phase !== currentState.phase) {
        stateMachine.dispatch(gameActions.phaseChanged(session.phase));
      }

      // Sync active player changes
      // FIXME: what happens with session.activePlayerId is null?
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

    // Subscribe to exchanges if needed
    // FIXME: callback needed?
    const exchangeSubscription = exchangesService.subscribeToChanges(sessionId);

    return () => {
      subscription.unsubscribe();
      exchangeSubscription.unsubscribe();
    };
  }, [sessionId, stateMachine]);

  // Helper function to fetch cards by IDs
  // FIXME: this should be accessible so functions in useCardManagement.ts can call it to convert cardIds to cards???
  async function fetchCardsByIds(cardIds: string[]) {
    if (!cardIds.length) return [];
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .in('id', cardIds);
      
    if (error) throw error;
    return data;
  }
}