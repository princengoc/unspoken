import React, { useState } from 'react';
import { Box, Text, Loader, Stack, Alert, Group, Paper, Badge, Button, Modal, Divider, Avatar } from '@mantine/core';
import { IconInfoCircle, IconExchange, IconArrowRight, IconArrowLeft, IconCheck, IconX, IconCards } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useExchanges, ExchangePair } from '@/hooks/game/useExchanges';
import { MiniCard } from '../CardDeck/MiniCard';
import { MiniDeck } from '../CardDeck/MiniDeck';
import { Card } from '@/core/game/types';
import { EnrichedExchangeRequest } from '@/hooks/game/useExchanges';

interface ExchangeTabProps {
  roomId: string;
}

export function ExchangeTab({ roomId }: ExchangeTabProps) {
  const { user } = useAuth();
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { members } = useRoomMembers();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'send' | 'counter'>('send');
  
  const {
    exchangePairs,
    loading,
    requestExchange,
    acceptRequest,
    declineRequest,
    hasMatch
  } = useExchanges({
    roomId,
    players: members,
    getCardById
  });

  if (loading) {
    return (
      <Box p="xl" ta="center">
        <Loader size="sm" />
        <Text mt="sm" size="sm" c="dimmed">Loading exchange requests...</Text>
      </Box>
    );
  }

  if (exchangePairs.length === 0) {
    return (
      <Box p="xl" ta="center">
        <Alert icon={<IconInfoCircle size={16} />} color="blue">
          <Text size="sm">
            No other players are available for exchanges.
          </Text>
        </Alert>
      </Box>
    );
  }

  const handleExchangeAction = (playerPair: ExchangePair, action: 'send' | 'counter' | 'accept' | 'decline') => {
    if (action === 'send' || action === 'counter') {
      setSelectedPlayer(playerPair.playerId);
      setModalType(action);
      setModalOpen(true);
    } else if (action === 'accept' && playerPair.incomingRequest) {
      acceptRequest(playerPair.incomingRequest.id);
    } else if (action === 'decline' && playerPair.incomingRequest) {
      declineRequest(playerPair.incomingRequest.id);
    }
  };

  const handleSubmitCard = (cardId: string) => {
    if (!selectedPlayer) return;
    
    requestExchange(selectedPlayer, cardId);
    setModalOpen(false);
    setSelectedPlayer(null);
  };

  // Helper to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'green';
      case 'declined': return 'red';
      default: return 'blue';
    }
  };

  // Render a card request section (either incoming or outgoing)
  const renderRequestCard = (
    request: EnrichedExchangeRequest | null, 
    direction: 'incoming' | 'outgoing', 
    pair: ExchangePair
  ) => {
    if (!request || !request.card) return (
      <Box>
        <Button 
          variant="subtle" 
          size="sm"
          leftSection={direction === 'outgoing' ? <IconArrowRight size={16} /> : <IconArrowLeft size={16} />}
          onClick={() => handleExchangeAction(
            // When request is null, use the pair parameter instead
            direction === 'outgoing' 
              ? exchangePairs.find(p => p.playerId === pair.playerId) as ExchangePair
              : exchangePairs.find(p => p.playerId === pair.playerId) as ExchangePair,
            direction === 'incoming' ? 'counter' : 'send'
          )}
        >
          {direction === 'outgoing' ? 'Send Request' : 'Counter Offer'}
        </Button>
      </Box>
    );

    return (
      <Stack gap="xs" align="center">
        <Box style={{ width: '120px' }}>
          <MiniCard 
            card={request.card} 
            size="sm"
          />
        </Box>
        <Badge 
          color={getStatusColor(request.status)}
          size="sm"
        >
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Badge>
      </Stack>
    );
  };

  // Render the player exchange row actions
  const renderActions = (pair: ExchangePair) => {
    if (pair.hasMatch) {
      return (
        <Badge color="green" size="lg" p="md">
          <Group gap="xs">
            <IconCheck size={16} />
            <Text>Match Confirmed!</Text>
          </Group>
        </Badge>
      );
    }

    if (pair.incomingRequest && pair.incomingRequest.status === 'pending') {
      return (
        <Group gap="xs">
          <Button
            variant="outline"
            color="red"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={() => handleExchangeAction(pair, 'decline')}
          >
            Decline
          </Button>
          <Button
            variant="outline"
            color="green"
            size="xs"
            leftSection={<IconCheck size={14} />}
            onClick={() => handleExchangeAction(pair, 'accept')}
          >
            Accept
          </Button>
        </Group>
      );
    }

    return null;
  };

  return (
    <Box>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
        <Text size="sm">
          Exchange requests let players challenge each other with cards from the discard pile.
          When both players accept, these cards will be available in encore rounds.
        </Text>
      </Alert>
      
      <Stack gap="md">
        {exchangePairs.map((pair) => (
          <Paper key={pair.playerId} p="md" withBorder>
            <Stack gap="md">
              <Group justify="center" gap="md">
                <Group>
                  <Avatar radius="xl" color="blue">
                    {pair.playerName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text fw={500}>{pair.playerName}</Text>
                  
                  {pair.hasMatch && (
                    <Badge color="green">Matched</Badge>
                  )}
                </Group>
                
                {renderActions(pair)}
              </Group>
              
              <Divider />
              
              <Group gap="md" justify="center">
                <Stack gap="xs" align="center">
                  <Text size="sm" fw={500}>Your Request</Text>
                  {renderRequestCard(pair.outgoingRequest, 'outgoing', pair)}
                </Stack>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconExchange size={24} stroke={1.5} />
                </Box>
                
                <Stack gap="xs" align="center">
                  <Text size="sm" fw={500}>Their Request</Text>
                  {renderRequestCard(pair.incomingRequest, 'incoming', pair)}
                </Stack>
              </Group>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Card selection modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === 'send' 
            ? "Send an exchange request" 
            : "Counter with a different card"
        }
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Select a card from the discard pile:
          </Text>
          
          {cardState.discardPile.length > 0 ? (
            <MiniDeck
              cards={getCardsByIds(cardState.discardPile)}
              onSelect={handleSubmitCard}
            />
          ) : (
            <Alert icon={<IconCards size={16} />} color="yellow">
              <Text>No cards are available in the discard pile yet.</Text>
            </Alert>
          )}
        </Stack>
      </Modal>
    </Box>
  );
}