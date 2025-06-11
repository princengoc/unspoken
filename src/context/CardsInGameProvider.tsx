import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { cardsInRoomsService } from "@/services/supabase/cardsInRooms";
import { supabase } from "@/services/supabase/client";
import type { Card, CardState } from "@/core/game/types";

interface CardsInGameContextType {
  // Card states
  cardState: CardState;

  // Card dictionary
  getCardById: (cardId: string) => Card | undefined;
  getCardsByIds: (cardIds: string[]) => Card[];

  // Operations
  completePlayerSetup: (selectedCardId: string) => Promise<void>;

  // Card dealing helper that includes fetching new cards
  dealCardsToPlayer: () => Promise<Card[]>;
}

const CardsInGameContext = createContext<CardsInGameContextType | null>(null);

interface CardsInGameProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

async function fetchCardsByIds(cardIds: string[]): Promise<Card[]> {
  if (!cardIds.length) return [];

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .in("id", cardIds);

  if (error) throw error;
  return data;
}

export function CardsInGameProvider({
  roomId,
  userId,
  children,
}: CardsInGameProviderProps) {
  // Track the current state of cards in the room
  const [cardState, setCardState] = useState<CardState>({
    roomPile: [],
    discardPile: [],
    playerHands: {},
    selectedCards: {},
  });

  // Card dictionary for quick lookups
  const [cardDictionary, setCardDictionary] = useState<Map<string, Card>>(
    new Map(),
  );

  // Wrap updateCardDictionary in useCallback to stabilize its reference.
  const updateCardDictionary = useCallback(
    async (cardIds: string[]) => {
      // Filter out cards we already have using the current cardDictionary
      const newCardIds = cardIds.filter((id) => !cardDictionary.has(id));
      if (newCardIds.length === 0) return;

      // Fetch new cards and update dictionary
      const newCards = await fetchCardsByIds(newCardIds);
      setCardDictionary((prev) => {
        const next = new Map(prev);
        newCards.forEach((card) => next.set(card.id, card));
        return next;
      });
    },
    [cardDictionary],
  );

  // Initialize card state and dictionary
  useEffect(() => {
    // Subscribe to card state changes. This already includes an initialization
    const subscription = cardsInRoomsService.subscribeToCardStateChanges(
      roomId,
      async (newState) => {
        // Update dictionary with any new cards
        await updateCardDictionary(newState.roomPile);
        setCardState(newState);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  // Card lookup helpers
  const getCardById = (cardId: string) => cardDictionary.get(cardId);

  const getCardsByIds = (cardIds: string[]) =>
    cardIds
      .map((id) => cardDictionary.get(id))
      .filter((card): card is Card => !!card);

  // Card operations
  const completePlayerSetup = useCallback(
    async (selectedCardId: string) => {
      try {
        const newState = await cardsInRoomsService.completePlayerSetup(
          roomId,
          userId,
          selectedCardId,
        );

        // update card state straight away
        setCardState(newState);
      } catch (error) {
        console.error("Failed to complete player setup:", error);
        throw error;
      }
    },
    [roomId, userId],
  );

  const dealCardsToPlayer = useCallback(async (): Promise<Card[]> => {
    // Get both dealt cards and new state
    const { cardIds, newState } = await cardsInRoomsService.dealCardsToPlayer(
      roomId,
      userId,
    );

    // update the card dictionary to keep getCardsByIds fresh
    await updateCardDictionary(newState.roomPile);
    setCardState(newState);

    return getCardsByIds(cardIds);
  }, [roomId, userId]);

  // this entire context is just wrapping around cardState
  // so really no need for useMemo
  const value = {
    cardState,
    getCardById,
    getCardsByIds,
    completePlayerSetup,
    dealCardsToPlayer,
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
    throw new Error("useCardsInGame must be used within CardsInGameProvider");
  }
  return context;
}
