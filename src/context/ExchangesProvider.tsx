import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { exchangeRequestsService, ExchangeRequest } from '@/services/supabase/exchangeRequests';
import { useAuth } from '@/context/AuthProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { Card } from '@/core/game/types';
import { notifications } from '@mantine/notifications';

// Enriched types
export interface EnrichedExchangeRequest extends ExchangeRequest {
  fromPlayer?: {
    id: string;
    username: string | null;
  };
  toPlayer?: {
    id: string;
    username: string | null;
  };
  card?: Card;
}

export interface ExchangePair {
  playerId: string;
  playerName: string;
  outgoingRequest: EnrichedExchangeRequest | null;
  incomingRequest: EnrichedExchangeRequest | null;
  hasMatch: boolean;
}

// Context type definition
interface ExchangesContextType {
  // Core data
  exchangePairs: ExchangePair[];
  incomingRequests: EnrichedExchangeRequest[];
  outgoingRequests: EnrichedExchangeRequest[];
  
  // Status
  loading: boolean;
  isSubscribed: boolean;
  
  // Actions
  requestExchange: (toPlayerId: string, cardId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  hasMatch: (request: ExchangeRequest) => boolean;
}

interface ExchangesProviderProps {
  roomId: string;
  children: ReactNode;
}

// Create context with no default value
const ExchangesContext = createContext<ExchangesContextType | null>(null);

export function ExchangesProvider({ roomId, children }: ExchangesProviderProps) {
  const { user } = useAuth();
  const { members } = useRoomMembers();
  const { getCardById } = useCardsInGame();
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  // Load initial data and set up subscription
  useEffect(() => {
    if (!roomId || !user?.id) {
      return;
    }

    let subscription: any = null;
    let isMounted = true; // Prevent state updates if unmounted

    // Initial data load
    const loadInitialData = async () => {
      try {
        const [outgoing, incoming] = await Promise.all([
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'outgoing'),
          exchangeRequestsService.getExchangeRequests(roomId, user.id, 'incoming')
        ]);
        
        if (isMounted) {
          setOutgoingRequests(outgoing);
          setIncomingRequests(incoming);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load exchange requests:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up subscription first, so we don't miss updates
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
        }
      );
      setSubscribed(true);
    };

    setupSubscription();
    loadInitialData();

    // Cleanup function
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [roomId, user?.id]);

  // Enhanced requests with player and card data
  const enrichedRequests = useMemo(() => {
    const getPlayerById = (playerId: string) => 
      members.find(p => p.id === playerId);

    return {
      outgoing: outgoingRequests.map(req => ({
        ...req,
        toPlayer: getPlayerById(req.to_id),
        card: getCardById(req.card_id)
      })),
      incoming: incomingRequests.map(req => ({
        ...req,
        fromPlayer: getPlayerById(req.from_id),
        card: getCardById(req.card_id)
      }))
    };
  }, [outgoingRequests, incomingRequests, members, getCardById]);

  // Unified exchange pairs data structure
  const exchangePairs = useMemo(() => {
    if (!user?.id) return [];

    const otherPlayers = members.filter(p => p.id !== user.id);
    
    return otherPlayers.map(player => {
      const outgoing = enrichedRequests.outgoing.find(req => req.to_id === player.id);
      const incoming = enrichedRequests.incoming.find(req => req.from_id === player.id);
      
      const hasMatch = !!(
        outgoing?.status === 'accepted' && 
        incoming?.status === 'accepted'
      );
      
      return {
        playerId: player.id,
        playerName: player.username || 'Unknown Player',
        outgoingRequest: outgoing || null,
        incomingRequest: incoming || null,
        hasMatch
      };
    });
  }, [enrichedRequests, members, user?.id]);

  // Action: Create a new exchange request
  const requestExchange = useCallback(async (toPlayerId: string, cardId: string) => {
    if (!user?.id || !roomId) return;
    
    try {
      await exchangeRequestsService.createRequest(
        roomId,
        user.id,
        toPlayerId,
        cardId
      );
      
      notifications.show({
        title: 'Request Sent',
        message: 'Exchange request has been sent.',
        color: 'blue'
      });
    } catch (error) {
      console.error('Failed to send exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send exchange request.',
        color: 'red'
      });
    }
  }, [roomId, user?.id]);

  // Action: Accept an incoming exchange request
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, 'accepted');
      
      notifications.show({
        title: 'Request Accepted',
        message: 'You accepted the exchange request.',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to accept exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to accept exchange request.',
        color: 'red'
      });
    }
  }, []);

  // Action: Decline an incoming exchange request
  const declineRequest = useCallback(async (requestId: string) => {
    try {
      await exchangeRequestsService.updateRequestStatus(requestId, 'declined');
      
      notifications.show({
        title: 'Request Declined',
        message: 'You declined the exchange request.',
        color: 'yellow'
      });
    } catch (error) {
      console.error('Failed to decline exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to decline exchange request.',
        color: 'red'
      });
    }
  }, []);

  // Helper: Check if a specific request has a match
  const hasMatch = useCallback((request: ExchangeRequest): boolean => {
    if (request.status !== 'accepted' || !user?.id) return false;
    
    if (request.from_id === user.id) {
      return incomingRequests.some(req => 
        req.from_id === request.to_id && 
        req.status === 'accepted'
      );
    } else {
      return outgoingRequests.some(req => 
        req.to_id === request.from_id &&
        req.status === 'accepted'
      );
    }
  }, [incomingRequests, outgoingRequests, user?.id]);

  const value = {
    // Core data
    exchangePairs,
    incomingRequests: enrichedRequests.incoming,
    outgoingRequests: enrichedRequests.outgoing,
    
    // Status
    loading,
    isSubscribed: subscribed,
    
    // Actions
    requestExchange,
    acceptRequest,
    declineRequest,
    hasMatch
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
    throw new Error('useExchanges must be used within an ExchangesProvider');
  }
  return context;
}