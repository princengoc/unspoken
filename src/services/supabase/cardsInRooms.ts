import { supabase } from './client';
import { CardState, GamePhase } from '@/core/game/types';
import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';

const CARDS_IN_ROOMS_DB = 'cards_in_rooms';

export const cardsInRoomsService = {
  // Fetch the full state of the cards in a room
  async fetchCurrentCardState(roomId: string): Promise<CardState> {
    const { data, error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .select('card_id, player_id, in_play, in_player_hand, in_player_selected')
      .eq('room_id', roomId);

    if (error) {
      console.error('Error fetching initial card state:', error);
      return { discardPile: [], roomPile: [], playerHands: {}, selectedCards: {} };
    }

    return {
      discardPile: data.filter(card => !card.in_play).map(card => card.card_id),
      roomPile: data.map(card => card.card_id),
      playerHands: data.reduce((hands, card) => {
        if (card.in_player_hand && card.player_id) {
          if (!hands[card.player_id]) hands[card.player_id] = [];
          hands[card.player_id].push(card.card_id);
        }
        return hands;
      }, {} as Record<string, string[]>),
      selectedCards: data.reduce((selected, card) => {
        if (card.in_player_selected && card.player_id) {
          selected[card.player_id] = card.card_id;
        }
        return selected;
      }, {} as Record<string, string>),
    };
  },

  // Subscribe to state changes for a room
  subscribeToCardStateChanges(roomId: string, callback: (state: CardState) => void) {
    // Fetch initial state
    this.fetchCurrentCardState(roomId).then(callback);

    return supabase
      .channel(`cards_in_room_changes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: CARDS_IN_ROOMS_DB,
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const newState = await this.fetchCurrentCardState(roomId);
          callback(newState);
        }
      )
      .subscribe();
  },

  /* Operations to make specific changes to the cards_in_rooms */

  // Move a list of cards to the discard pile 
  async moveCardsToDiscard(roomId: string, cardIds: string[]): Promise<void> {
    const { error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .update({ in_play: false, in_player_hand: false }) // keep player_id will keep the selectedCards, enables history tracking
      .filter('room_id', 'eq', roomId)
      .in('card_id', cardIds);
  
    if (error) {
      console.error('Error moving cards to discard:', error);
      throw error;
    }
  }, 

  async dealCardsToPlayer(roomId: string, playerId: string): Promise<{
    cardIds: string[], 
    newState: CardState
  }> {
    // Server-side function does dealing and coordinating updates across multiple tables
    const { data: dealtCardIds, error } = await supabase.rpc('deal_cards_to_player', {
      p_room_id: roomId,
      p_player_id: playerId,
      p_cards_per_player: INITIAL_CARDS_PER_PLAYER
    });

    if (error) throw error;

    // Fetch the new state immediately after dealing
    const newState = await this.fetchCurrentCardState(roomId);

    return { 
      cardIds: dealtCardIds as string[],
      newState 
    };
  },

  async completePlayerSetup(
    roomId: string,
    playerId: string,
    selectedCardId: string
  ): Promise<void> {
    const { error } = await supabase.rpc('complete_player_setup', {
      p_room_id: roomId,
      p_player_id: playerId,
      p_selected_card_id: selectedCardId
    });
  
    if (error) {
      console.error('Error completing player setup:', error);
      throw error;
    }
  }

};