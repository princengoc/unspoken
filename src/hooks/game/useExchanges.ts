import { useState, useEffect } from 'react';
import { exchangeRequestsService, ExchangeRequest } from '@/services/supabase/exchangeRequests';
import { useAuth } from '@/context/AuthProvider';
import { Card, Player } from '@/core/game/types';
import { notifications } from '@mantine/notifications';

interface UseExchangesProps {
  roomId: string;
  players: Player[];
  getCardById: (cardId: string) => Card | undefined;
}

export function useExchanges({ roomId, players, getCardById }: UseExchangesProps) {
  const { user } = useAuth();
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Load exchange requests and subscribe to changes
  useEffect(() => {
    if (!roomId || !user?.id) return;

    const loadRequests = async () => {
      try {
        setLoading(true);
        const outgoing = await exchangeRequestsService.getExchangeRequests(roomId, user.id, 'outgoing');
        const incoming = await exchangeRequestsService.getExchangeRequests(roomId, user.id, 'incoming');
        
        setOutgoingRequests(outgoing);
        setIncomingRequests(incoming);
      } catch (error) {
        console.error('Failed to load exchange requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();

    // Subscribe to changes
    const subscription = exchangeRequestsService.subscribeToExchangeRequests(
      roomId,
      (allRequests) => {
        // Filter for current user
        const outgoing = allRequests.filter(req => req.from_id === user.id);
        const incoming = allRequests.filter(req => req.to_id === user.id);
        
        setOutgoingRequests(outgoing);
        setIncomingRequests(incoming);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, user?.id]);

  // Create a new exchange request
  const requestExchange = async (toPlayerId: string, cardId: string) => {
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
  };

  // Accept an incoming exchange request
  const acceptRequest = async (requestId: string) => {
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
  };

  // Decline an incoming exchange request
  const declineRequest = async (requestId: string) => {
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
  };

  // Counter an incoming exchange request with a different card
  const counterRequest = async (fromPlayerId: string, cardId: string) => {
    if (!user?.id || !roomId) return;
    
    try {
      await exchangeRequestsService.createRequest(
        roomId,
        user.id,
        fromPlayerId,
        cardId
      );
      
      notifications.show({
        title: 'Counter Offer',
        message: 'You countered with a different card.',
        color: 'blue'
      });
    } catch (error) {
      console.error('Failed to counter exchange request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to counter exchange request.',
        color: 'red'
      });
    }
  };

  // Helper to find player by ID
  const getPlayerById = (playerId: string): Player | undefined => {
    return players.find(p => p.id === playerId);
  };

  // Prepare requests with player and card data for UI
  const enrichedOutgoingRequests = outgoingRequests.map(req => ({
    ...req,
    toPlayer: getPlayerById(req.to_id),
    card: getCardById(req.card_id)
  }));

  const enrichedIncomingRequests = incomingRequests.map(req => ({
    ...req,
    fromPlayer: getPlayerById(req.from_id),
    card: getCardById(req.card_id)
  }));

  // Check if there's a match for the given request
  const hasMatch = (request: ExchangeRequest): boolean => {
    // Find a matching request from the other player
    const match = outgoingRequests.find(req => 
      req.to_id === request.from_id && 
      req.status === 'accepted' && 
      request.status === 'accepted'
    );
    
    return !!match;
  };

  return {
    outgoingRequests: enrichedOutgoingRequests,
    incomingRequests: enrichedIncomingRequests,
    loading,
    requestExchange,
    acceptRequest,
    declineRequest,
    counterRequest,
    hasMatch
  };
}