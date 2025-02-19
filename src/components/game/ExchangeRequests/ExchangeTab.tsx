import { Tabs, Box, Text, Loader, Stack, Alert } from '@mantine/core';
import { IconArrowRight, IconArrowLeft, IconInfoCircle } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthProvider';
import { useCardsInGame } from '@/context/CardsInGameProvider';
import { useRoomMembers } from '@/context/RoomMembersProvider';
import { useExchanges } from '@/hooks/game/useExchanges';
import { OutgoingRequests } from './OutgoingRequests';
import { IncomingRequests } from './IncomingRequests';

interface ExchangeTabProps {
  roomId: string;
}

export function ExchangeTab({ roomId }: ExchangeTabProps) {
  const { user } = useAuth();
  const { cardState, getCardById } = useCardsInGame();
  const { members } = useRoomMembers();
  
  // Filter out current user from members
  const otherMembers = members.filter(m => m.id !== user?.id);
  
  const {
    outgoingRequests,
    incomingRequests,
    loading,
    requestExchange,
    acceptRequest,
    declineRequest,
    counterRequest
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

  return (
    <Box>
      <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
        <Text size="sm">
          Exchange cards with other players. Both players must accept for an exchange to be finalized.
        </Text>
      </Alert>
      
      <Tabs defaultValue="outgoing">
        <Tabs.List>
          <Tabs.Tab 
            value="outgoing" 
            leftSection={<IconArrowRight size={16} />}
            rightSection={outgoingRequests.length ? <Box>{outgoingRequests.length}</Box> : null}
          >
            Outgoing Requests
          </Tabs.Tab>
          <Tabs.Tab 
            value="incoming" 
            leftSection={<IconArrowLeft size={16} />}
            rightSection={incomingRequests.length ? <Box>{incomingRequests.length}</Box> : null}
          >
            Incoming Requests
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="outgoing" p="md">
          {otherMembers.length === 0 ? (
            <Text c="dimmed" ta="center" mt="md">No other players to exchange with</Text>
          ) : (
            <OutgoingRequests 
              requests={outgoingRequests}
              otherMembers={otherMembers}
              roomId={roomId}
            />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="incoming" p="md">
          {incomingRequests.length === 0 ? (
            <Text c="dimmed" ta="center" mt="md">No incoming exchange requests</Text>
          ) : (
            <IncomingRequests 
              requests={incomingRequests}
              onAccept={acceptRequest}
              onDecline={declineRequest}
              onCounter={(fromPlayerId, cardId) => counterRequest(fromPlayerId, cardId)}
              currentUserCards={user?.id ? cardState.playerHands[user.id] || [] : []}
              getCardById={getCardById}
            />
          )}
        </Tabs.Panel>
      </Tabs>
    </Box>
  );
}