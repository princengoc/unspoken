import { supabase } from './client';
import { CardState } from '@/core/game/types';

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

  // Add multiple new cards to a room
  async addNewCards(roomId: string, cardIds: string[]): Promise<void> {
    if (cardIds.length === 0) return;

    const cardsToInsert = cardIds.map(cardId => ({
      card_id: cardId,
      room_id: roomId,
    }));

    const { error } = await supabase.from(CARDS_IN_ROOMS_DB).insert(cardsToInsert);

    if (error) {
      console.error('Error adding new cards:', error);
      throw error;
    }
  },

  // Add cards then assign them to player hand straight away
  async addNewCardsToPlayer(roomId: string, cardIds: string[], playerId: string): Promise<void> {
    if (cardIds.length === 0) return; // Prevent unnecessary DB query
  
    const cardsToInsert = cardIds.map(cardId => ({
      card_id: cardId,
      room_id: roomId,
      player_id: playerId,
      in_play: true,         // The card is in play
      in_player_hand: true,  // The card is in the player's hand
      in_player_selected: false, // Default state: not selected yet
    }));
  
    const { error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .insert(cardsToInsert);
  
    if (error) {
      console.error('Error dealing cards to player:', error);
      throw error;
    }
  },  

  // Move a list of cards to the discard pile 
  async moveCardsToDiscard(roomId: string, cardIds: string[]): Promise<void> {
    const { error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .update({ in_play: false, player_id: null })
      .filter('room_id', 'eq', roomId)
      .in('card_id', cardIds);
  
    if (error) {
      console.error('Error moving cards to discard:', error);
      throw error;
    }
  }, 

  async markCardAsSelected(roomId: string, cardId: string, playerId: string): Promise<void> {
    const { error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .update({ in_player_selected: true, player_id: playerId })
      .filter('room_id', 'eq', roomId)
      .filter('card_id', 'eq', cardId);
  
    if (error) {
      console.error('Error moving card to player hand:', error);
      throw error;
    }
  },
  
  // Move multiple cards into a player's hand
  async moveCardsToPlayerHand(roomId: string, cardIds: string[], playerId: string): Promise<void> {
    if (cardIds.length === 0) return; // Prevent unnecessary DB query
  
    const { error } = await supabase
      .from(CARDS_IN_ROOMS_DB)
      .update({ in_player_hand: true, player_id: playerId })
      .filter('room_id', 'eq', roomId)
      .in('card_id', cardIds);
  
    if (error) {
      console.error('Error moving cards to player hand:', error);
      throw error;
    }
  },
};