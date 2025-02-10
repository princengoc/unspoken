import { useState } from 'react';
import { gameStatesService } from '@/services/supabase/gameStates';
import { WILD_CARDS_COUNT } from '@/core/game/constants';
import { useGameState } from '@/context/GameStateProvider';
import { gameActions } from '@/core/game/actions';
import { supabase } from '@/services/supabase/client';
import { Card } from '@/core/game/types';

export function useCardManagement(sessionId: string | null, userId: string | null) {
  const stateMachine = useGameState();
  const [loading, setLoading] = useState(false);

  const dealInitialCards = async () => {
    if (!sessionId || !userId) return;
    
    try {
      setLoading(true);
      const cards = await gameStatesService.dealCards(sessionId, userId);
      
      // Update state machine
      stateMachine.dispatch(gameActions.cardsDealt(userId, cards));
      
    } catch (error) {
      console.error('Failed to deal cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectCardForPool = async (playerId: string, cardId: string) => {
    if (!sessionId) return;
  
    try {
      const currentState = stateMachine.getState();
      
      // Check if card is already in play
      const isCardAlreadyInPlay = currentState.cardsInPlay.some(card => card.id === cardId);
      if (isCardAlreadyInPlay) {
        return;
      }
  
      // Update state machine - deduplication happens in reducer
      stateMachine.dispatch(gameActions.selectCard(playerId, cardId));
      
      // Get the deduplicated state
      const updatedState = stateMachine.getState();
      
      // Sync with Supabase using the deduplicated state
      await gameStatesService.update(sessionId, {
        cardsInPlay: updatedState.cardsInPlay,
        players: updatedState.players
      });
  
      // Check if all players have selected
      const allPlayersSelected = updatedState.players.every(p => p.hasSelected);
      if (allPlayersSelected) {
        // Move to next phase
        stateMachine.dispatch(gameActions.startGame());
        
        // Update game phase in database
        await gameStatesService.update(sessionId, {
          phase: 'speaking',
          activePlayerId: updatedState.players[0].id
        });
      }
  
    } catch (error) {
      console.error('Failed to select card:', error);
      throw error;
    }
  };
  
  const addWildCards = async () => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const state = stateMachine.getState();
      
      // Get current cards in play
      const currentCardIds = state.cardsInPlay.map(card => card.id);
      
      // Get random wild cards
      // this supabase function returns entries of cards table, which can be directly casted
      const { data: wildCards, error: wildCardsError } = await supabase.rpc(
        'get_random_cards',
        {
          limit_count: WILD_CARDS_COUNT,
          exclude_ids: currentCardIds,
        }
      );
  
      if (wildCardsError) throw wildCardsError;
      if (!wildCards) throw new Error('Failed to get wild cards');

      const wildCardsCasted = wildCards as Card[];

      // First dispatch to state machine - it will handle deduplication
      stateMachine.dispatch(gameActions.cardsSelected(wildCardsCasted));

      // Then update Supabase with the deduplicated state
      const updatedState = stateMachine.getState();
      await gameStatesService.update(sessionId, {
        cardsInPlay: updatedState.cardsInPlay
      });
      
    } catch (error) {
      console.error('Failed to add wild cards:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get current state values
  const state = stateMachine.getState();
  const playerHands = state.playerHands;
  const cardsInPlay = state.cardsInPlay;
  const selectedCards = state.players.reduce((acc, player) => ({
    ...acc,
    [player.id]: player.hasSelected
  }), {});

  return {
    playerHands,
    cardsInPlay,
    selectedCards,
    loading,
    dealInitialCards,
    selectCardForPool,
    addWildCards
  };
}