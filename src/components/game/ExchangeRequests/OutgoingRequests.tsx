import { useState } from 'react';
import { Stack, Group, Text, Paper, Badge, Avatar, Box, Button, Modal } from '@mantine/core';
import { IconExchange, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { MiniCard } from '../CardDeck/MiniCard';
import { ExchangeRequest } from '@/services/supabase/exchangeRequests';
import { Player } from '@/core/game/types';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useAuth } from '@/context/AuthProvider';
import { useExchanges } from '@/hooks/game/useExchanges';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { MiniDeck } from '../CardDeck/MiniDeck';

interface OutgoingRequestsProps {
  requests: Array<ExchangeRequest & { 
    toPlayer?: Player, 
    card?: any 
  }>;
  otherMembers: Player[];
  roomId: string;
}

export function OutgoingRequests({ requests, otherMembers, roomId }: OutgoingRequestsProps) {
  const { user } = useAuth();
  const { cardState, getCardById, getCardsByIds } = useCardsInGame();
  const { members } = useRoomMembers();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const discardedCards = getCardsByIds(cardState.discardPile);

  const { requestExchange } = useExchanges({
    roomId,
    players: members,
    getCardById
  });

  // Get players without outgoing requests
  const playersWithoutRequests = otherMembers.filter(player => 
    !requests.some(req => req.to_id === player.id)
  );

  const handleCreateRequest = (playerId: string, cardId: string) => {
    requestExchange(playerId, cardId);
    setModalOpen(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <IconCheck size={16} color="green" />;
      case 'declined':
        return <IconX size={16} color="red" />;
      default:
        return <IconClock size={16} color="orange" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'green';
      case 'declined': return 'red';
      default: return 'orange';
    }
  };

  return (
    <Stack gap="md">
      {requests.length > 0 && (
        <Stack gap="sm">
          <Text fw={500}>Current Requests</Text>
          {requests.map(request => (
            <Paper key={request.id} p="sm" withBorder>
              <Group justify="space-between" align="center">
                <Group>
                  <Avatar 
                    radius="xl" 
                    color="blue" 
                    size="md"
                  >
                    {request.toPlayer?.username?.charAt(0).toUpperCase() || '?'}
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={500}>{request.toPlayer?.username || 'Unknown Player'}</Text>
                    <Badge 
                      color={getStatusColor(request.status)}
                      leftSection={getStatusIcon(request.status)}
                      variant="light"
                      size="sm"
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </Box>
                </Group>
                {request.card && (
                  <Box style={{ maxWidth: '120px' }}>
                    <MiniCard 
                      card={request.card}
                      size="sm"
                    />
                  </Box>
                )}
              </Group>
            </Paper>
          ))}
        </Stack>
      )}

      {playersWithoutRequests.length > 0 && (
        <Stack gap="sm" mt="md">
          <Text fw={500}>Request an Exchange</Text>
          <Group>
            {playersWithoutRequests.map(player => (
              <Button 
                key={player.id}
                variant="light"
                leftSection={<IconExchange size={16} />}
                onClick={() => {
                  setSelectedPlayer(player);
                  setModalOpen(true);
                }}
              >
                {player.username || 'Unknown Player'}
              </Button>
            ))}
          </Group>
        </Stack>
      )}

      {/* Card selection modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Challenge ${selectedPlayer?.username || 'player'} to answer this. In exchange, you will answer a card that they propose.`}
        size="lg"
      >
        {selectedPlayer && user?.id && (
          <Stack>
            <Text size="sm" c="dimmed">
              Select a card from the discard pile to propose:
            </Text>

            <MiniDeck
              cards={discardedCards}
              onSelect={(cardId) => handleCreateRequest(selectedPlayer.id, cardId)}
            />
          </Stack>
        )}
      </Modal>
    </Stack>
  );

}