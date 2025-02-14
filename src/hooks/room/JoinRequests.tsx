import { useEffect, useState } from 'react';
import { Popover, Group, Avatar, Indicator, ActionIcon, Tooltip } from '@mantine/core';
import { IconUserPlus, IconCheck, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { roomMembersService } from '@/services/supabase/roomMembers';
import { useAuth } from '@/context/AuthProvider';
import { useRoomHook } from './useRoomHook';
import CopyCodeButton from './CopyCodeButton';


interface JoinRequestsProps {
  roomId: string;
}

export function JoinRequests({ roomId }: JoinRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const { findPasscodeByRoom} = useRoomHook();

  const [roomPasscode, setRoomPasscode] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if unmounted
  
    const fetchPasscode = async () => {
      const passcode = await findPasscodeByRoom(roomId);
      if (isMounted) {
        setRoomPasscode(passcode);
      }
    };
  
    if (roomId) {
      fetchPasscode();
    }
  
    return () => {
      isMounted = false; // Cleanup to prevent memory leaks
    };
  }, [roomId, findPasscodeByRoom]);

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
        message: `Request to join room from ${user.id} is ${status}`,
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

  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      position="top"
      withArrow
    >
      <Popover.Target>
        {requests.length > 0 ? (
          <Indicator label={String(requests.length)} inline size={16} color="red">
            <ActionIcon variant="subtle" size="lg" onClick={() => setOpened((o) => !o)}>
              <IconUserPlus size={20} />
            </ActionIcon>
          </Indicator>
        ) : (
          <ActionIcon variant="subtle" size="lg" onClick={() => setOpened((o) => !o)}>
            <IconUserPlus size={20} />
          </ActionIcon>
        )}
      </Popover.Target>

      <Popover.Dropdown>
        {requests.length > 0 ? (
          requests.map((request) => (
            <Group key={request.id} align="center" gap="xs">
              <Tooltip label={request.user_id} position="top" withArrow>
                <Avatar radius="xl" size={24}>
                  {request.user_id.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
              <Group gap='sm'>
                <Tooltip label="Decline" position="top" withArrow>
                  <ActionIcon
                    color="red"
                    onClick={() => 
                      {
                        handleRequest(request.id, 'rejected'); 
                        setOpened(false);
                      }
                    }
                    disabled={loading}
                  >
                    <IconX size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Approve" position="top" withArrow>
                  <ActionIcon
                    color="green"
                    onClick={() => {
                      handleRequest(request.id, 'approved');
                      setOpened(false);
                      }
                    }
                    disabled={loading}
                  >
                    <IconCheck size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          ))
        ) : (
          <CopyCodeButton roomPasscode={roomPasscode} setOpened={setOpened} />
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
