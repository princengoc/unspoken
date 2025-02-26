import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { exchangeRequestsService } from "@/services/supabase/exchangeRequests";
import { useAuth } from "@/context/AuthProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { notifications } from "@mantine/notifications";
import { ExchangeRequest, EnrichedExchangeRequest } from "@/core/game/types";

// Updated context type definition
interface ExchangesContextType {
  // Split into clear incoming/outgoing
  incomingRequests: EnrichedExchangeRequest[];
  outgoingRequests: EnrichedExchangeRequest[];

  // Status
  loading: boolean;
  isSubscribed: boolean;

  // Actions
  requestExchange: (toPlayerId: string, cardId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;

  // Helper method to check if we have any matches
  hasMatch: boolean;
}

interface ExchangesProviderProps {
  roomId: string;
  children: ReactNode;
}

const ExchangesContext = createContext<ExchangesContextType | null>(null);

export function ExchangesProvider({
  roomId,
  children,
}: ExchangesProviderProps) {
  const { user } = useAuth();
  const { members } = useRoomMembers();
  const { getCardById } = useCardsInGame();
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>(
    [],
  );
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!roomId || !user?.id) return;

    let subscription: any = null;
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const [outgoing, incoming] = await Promise.all([
          exchangeRequestsService.getExchangeRequests(
            roomId,
            user.id,
            "outgoing",
          ),
          exchangeRequestsService.getExchangeRequests(
            roomId,
            user.id,
            "incoming",
          ),
        ]);

        if (isMounted) {
          setOutgoingRequests(outgoing);
          setIncomingRequests(incoming);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load exchange requests:", error);
        if (isMounted) setLoading(false);
      }
    };

    const setupSubscription = () => {
      subscription = exchangeRequestsService.subscribeToExchangeRequests(
        roomId,
        user.id,
        (outgoing, incoming) => {
          if (isMounted) {
            setOutgoingRequests(outgoing);
            setIncomingRequests(incoming);
            setLoading(false);
          }
        },
      );
      setSubscribed(true);
    };

    setupSubscription();
    loadInitialData();

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [roomId, user?.id]);

  // Enhance requests with player and card data
  const enrichedRequests = useMemo(() => {
    const getPlayerById = (playerId: string) =>
      members.find((p) => p.id === playerId);

    return {
      outgoing: outgoingRequests.map((req) => ({
        ...req,
        otherPlayer: getPlayerById(req.to_id),
        card: getCardById(req.card_id),
      })),
      incoming: incomingRequests.map((req) => ({
        ...req,
        otherPlayer: getPlayerById(req.from_id),
        card: getCardById(req.card_id),
      })),
    };
  }, [outgoingRequests, incomingRequests, members, getCardById]);

  // Derive overall match state FOR THIS PLAYER - if any exchange involving current player is matched
  const hasMatchState = useMemo(() => {
    return [...enrichedRequests.incoming, ...enrichedRequests.outgoing].some(
      (req) => req.status === "matched",
    );
  }, [enrichedRequests]);

  const requestExchange = useCallback(
    async (toPlayerId: string, cardId: string) => {
      if (!user?.id || !roomId) return;

      try {
        await exchangeRequestsService.createRequest(
          roomId,
          user.id,
          toPlayerId,
          cardId,
        );
        notifications.show({
          title: "Request Sent",
          message: "Exchange request has been sent.",
          color: "blue",
        });
      } catch (error) {
        console.error("Failed to send exchange request:", error);
        notifications.show({
          title: "Error",
          message: "Failed to send exchange request.",
          color: "red",
        });
      }
    },
    [roomId, user?.id],
  );

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, "accepted");
      notifications.show({
        title: "Request Accepted",
        message: "You accepted the exchange request.",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to accept exchange request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to accept exchange request.",
        color: "red",
      });
    }
  }, []);

  const declineRequest = useCallback(async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, "declined");
      notifications.show({
        title: "Request Declined",
        message: "You declined the exchange request.",
        color: "yellow",
      });
    } catch (error) {
      console.error("Failed to decline exchange request:", error);
      notifications.show({
        title: "Error",
        message: "Failed to decline exchange request.",
        color: "red",
      });
    }
  }, []);

  const value = {
    incomingRequests: enrichedRequests.incoming,
    outgoingRequests: enrichedRequests.outgoing,
    loading,
    isSubscribed: subscribed,
    requestExchange,
    acceptRequest,
    declineRequest,
    hasMatch: hasMatchState,
  };

  return (
    <ExchangesContext.Provider value={value}>
      {children}
    </ExchangesContext.Provider>
  );
}

export function useExchanges() {
  const context = useContext(ExchangesContext);
  if (!context) {
    throw new Error("useExchanges must be used within an ExchangesProvider");
  }
  return context;
}
