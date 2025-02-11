import { useEffect, useState } from 'react';
import { Paper, Stack, Text, Group, Avatar, Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { roomMembersService } from '@/services/supabase/roomMembers';
import { useAuth } from '@/context/AuthProvider';

interface JoinRequestsProps {
  roomId: string;
}

export function JoinRequests({ roomId }: JoinRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    // Initial fetch
    const fetchRequests = async () => {
      try {
        const data = await roomMembersService.getJoinRequestsForRoom(roomId);
        setRequests(data);
      } catch (error) {
        console.error('Failed to fetch join requests:', error);
      }
    };
    fetchRequests();

    // Subscribe to changes
    const subscription = roomMembersService.subscribeToJoinRequests(
      roomId,
      (updatedRequests) => setRequests(updatedRequests)
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const handleRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    
    setLoading(true);
    try {
      await roomMembersService.handleJoinRequest(requestId, status, user.id);
      
      notifications.show({
        title: 'Success',
        message: `Request ${status}`,
        color: status === 'approved' ? 'green' : 'red'
      });
    } catch (error) {
      console.error('Failed to handle request:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to handle request',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!requests.length) return null;

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="md">
        <Text size="sm" fw={500}>Join Requests</Text>
        
        {requests.map((request) => (
          <Paper key={request.id} withBorder p="sm" radius="md">
            <Group position="apart">
              <Group>
                <Avatar radius="xl" color="blue">
                  {request.user_id.charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm">{request.user_id}</Text>
              </Group>
              
              <Group>
                <Button
                  size="xs"
                  variant="outline"
                  color="red"
                  loading={loading}
                  onClick={() => handleRequest(request.id, 'rejected')}
                >
                  Decline
                </Button>
                <Button
                  size="xs"
                  loading={loading}
                  onClick={() => handleRequest(request.id, 'approved')}
                >
                  Approve
                </Button>
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}