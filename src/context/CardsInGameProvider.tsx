import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { cardsInRoomsService } from '@/services/supabase/cardsInRooms';
import { supabase } from '@/services/supabase/client';
import { reactionsService } from '@/services/supabase/reactions';
import { INITIAL_CARDS_PER_PLAYER } from '@/core/game/constants';
import type { Card, CardState, MatchedExchange } from '@/core/game/types';

interface CardsInGameContextType {
  // Card states
  cardState: CardState;
  
  // Card dictionary
  getCardById: (cardId: string) => Card | undefined;
  getCardsByIds: (cardIds: string[]) => Card[];
  
  // Operations
  addNewCards: (cardIds: string[]) => Promise<void>;
  addNewCardsToPlayer: (cardIds: string[], playerId: string) => Promise<void>;
  moveCardsToDiscard: (cardIds: string[]) => Promise<void>;
  moveCardsToPlayerHand: (cardIds: string[], playerId: string) => Promise<void>;
  selectCardAmong: (selectedCardId: string, playerId: string, discardCardIds: string[]) => Promise<void>;
  emptyPlayerHand: (playerId: string) => Promise<void>; // convenient function to reset cards_in_game state: empty all cards in player hand to discard
  
  // Card dealing helper that includes fetching new cards
  dealCardsToPlayer: (playerId: string) => Promise<Card[]>;

  // utility functions
  hasSelected: (playerId: string) => boolean;
}

const CardsInGameContext = createContext<CardsInGameContextType | null>(null);

interface CardsInGameProviderProps {
  roomId: string;
  children: ReactNode;
}

async function fetchCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds.length) return [];
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .in('id', cardIds);
    
  if (error) throw error;
  return data;
}

export function CardsInGameProvider({ roomId, children }: CardsInGameProviderProps) {
  // Track the current state of cards in the room
  const [cardState, setCardState] = useState<CardState>({
    roomPile: [],
    discardPile: [], 
    playerHands: {},
    selectedCards: {}
  });

  // Card dictionary for quick lookups
  const [cardDictionary, setCardDictionary] = useState<Map<string, Card>>(new Map());

  // Helper to update card dictionary with new cards
  const updateCardDictionary = async (cardIds: string[]) => {
    // Filter out cards we already have
    const newCardIds = cardIds.filter(id => !cardDictionary.has(id));
    if (newCardIds.length === 0) return;

    // Fetch new cards and update dictionary
    const newCards = await fetchCardsByIds(newCardIds);
    setCardDictionary(prev => {
      const next = new Map(prev);
      newCards.forEach(card => next.set(card.id, card));
      return next;
    });
  };

  // Initialize card state and dictionary
  useEffect(() => {
    const initializeCards = async () => {
      try {
        // Get initial card state
        const initialState = await cardsInRoomsService.fetchCurrentCardState(roomId);
        setCardState(initialState);

        // Initialize card dictionary with all cards in the room
        await updateCardDictionary(initialState.roomPile);
      } catch (error) {
        console.error('Failed to initialize cards:', error);
      }
    };

    initializeCards();

    // Subscribe to card state changes
    const subscription = cardsInRoomsService.subscribeToCardStateChanges(
      roomId,
      async (newState) => {
        // Update dictionary with any new cards
        await updateCardDictionary(newState.roomPile);
        setCardState(newState);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  // Card lookup helpers
  const getCardById = (cardId: string) => cardDictionary.get(cardId);
  
  const getCardsByIds = (cardIds: string[]) => 
    cardIds.map(id => cardDictionary.get(id)).filter((card): card is Card => !!card);

  // Card operations
  const addNewCards = async (cardIds: string[]) => {
    await cardsInRoomsService.addNewCards(roomId, cardIds);
    await updateCardDictionary(cardIds);
  };

  const addNewCardsToPlayer = async (cardIds: string[], playerId: string) => {
    await cardsInRoomsService.addNewCardsToPlayer(roomId, cardIds, playerId);
    await updateCardDictionary(cardIds);
  };

  const moveCardsToDiscard = async (cardIds: string[]) => {
    await cardsInRoomsService.moveCardsToDiscard(roomId, cardIds);
  };

  const selectCardAmong = async (
    selectedCardId: string,
    playerId: string,
    discardCardIds: string[]
  ): Promise<void> => {
    await cardsInRoomsService.selectCardAmong(roomId, selectedCardId, playerId, discardCardIds);
  };
  
  const moveCardsToPlayerHand = async (cardIds: string[], playerId: string) => {
    await cardsInRoomsService.moveCardsToPlayerHand(roomId, cardIds, playerId);
  };

  const emptyPlayerHand = async (playerId: string) => {
    const player_hand = cardState.playerHands[playerId]; 
    if (player_hand) {
      cardsInRoomsService.moveCardsToDiscard(roomId, player_hand);
    }
  };
  
  const dealCardsToPlayer = async (playerId: string): Promise<Card[]> => {
    // server-side function does all the hard work of coordinating across different tables
    // eg room settings, cards_in_rooms etc
    const { data: availableCardIds, error } = await supabase.rpc('deal_cards_to_player', {
      p_room_id: roomId, 
      p_player_id: playerId, 
      p_cards_per_player: INITIAL_CARDS_PER_PLAYER
    });

    if (error) {
      console.error(`Deal Cards error: ${JSON.stringify(error)}`, error);
      throw error;
    }

    // TODO: need to check if we need to update card dictionary

    // return all the cards in player's hand
    const availableCards = getCardsByIds(availableCardIds);
    return availableCards; 
  };

  const hasSelected = (playerId: string): boolean => {
    return playerId in cardState.selectedCards && cardState.selectedCards[playerId] !== null;
  };  

  const value = {
    cardState,
    getCardById,
    getCardsByIds,
    addNewCards,
    addNewCardsToPlayer,
    moveCardsToDiscard,
    moveCardsToPlayerHand,
    selectCardAmong,
    emptyPlayerHand,
    dealCardsToPlayer,
    hasSelected
  };

  return (
    <CardsInGameContext.Provider value={value}>
      {children}
    </CardsInGameContext.Provider>
  );
}

export function useCardsInGame() {
  const context = useContext(CardsInGameContext);
  if (!context) {
    throw new Error('useCardsInGame must be used within CardsInGameProvider');
  }
  return context;
}