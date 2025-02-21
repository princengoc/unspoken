import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, TextInput, Stack, Button, Text, Group, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRoomAPI } from '@/hooks/room/useRoomAPI';
import { roomMembersService } from '@/services/supabase/roomMembers';
import { useAuth } from '@/context/AuthProvider';

export function JoinRoom() {
  const router = useRouter();
  const { findRoomByPasscode, joinRoom, loading: roomLoading } = useRoomAPI();
  const { user } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [joinRequest, setJoinRequest] = useState<any | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Format passcode as user types: uppercase and limit to 6 chars
  const handlePasscodeChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setPasscode(formatted);
  };

  // Check request status periodically if we have a pending request
  useEffect(() => {
    if (!joinRequest?.room_id || !user) return;

    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const request = await roomMembersService.checkJoinRequest(
          joinRequest.room_id,
          user.id
        );

        if (request?.status === 'approved') {
          notifications.show({
            title: 'Approved!',
            message: 'Your join request was approved',
            color: 'green'
          });
          // Now we can actually join the room
          await joinRoom(request.room_id);
          router.push(`/room/${request.room_id}`);
        } else if (request?.status === 'rejected') {
          notifications.show({
            title: 'Rejected',
            message: 'Your join request was declined',
            color: 'red'
          });
          setJoinRequest(null);
        } else {
          setJoinRequest(request);
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [joinRequest?.room_id, user, router, joinRoom]);

  const handleJoin = async () => {
    if (!user) return;
    
    if (passcode.length !== 6) {
      notifications.show({
        title: 'Error',
        message: 'Please enter a valid 6-character passcode',
        color: 'red'
      });
      return;
    }
  
    try {
      const room = await findRoomByPasscode(passcode);
      
      // Check if user is room creator
      if (room.created_by === user.id) {
        await joinRoom(room.id);
        router.push(`/room/${room.id}`);
        return;
      }
  
      const existingRequest = await roomMembersService.checkJoinRequest(room.id, user.id);
  
      if (existingRequest?.status === 'approved') {
        await joinRoom(room.id);
        router.push(`/room/${room.id}`);
        return;
      }
  
      if (!existingRequest || existingRequest.status === 'rejected') {
        const request = await roomMembersService.createJoinRequest(room.id, user.id);
        setJoinRequest(request);
        notifications.show({
          title: 'Request Sent',
          message: 'Waiting for room creator to approve your request',
          color: 'blue'
        });
      } else {
        setJoinRequest(existingRequest);
        notifications.show({
          title: 'Existing Request',
          message: 'Your join request is still pending approval',
          color: 'blue'
        });
      }
    } catch (error) {
      console.error("Error in handleJoin:", error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : `Failed to join in handleJoin: ${JSON.stringify(error)}`,
        color: 'red'
      });
    }
  };
  

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        {joinRequest ? (
          <Stack align="center" gap="md">
            <Text size="lg" fw={500}>Waiting for Approval</Text>
            <Group>
              <Loader size="sm" />
              <Text size="sm">Waiting for room creator to approve your request...</Text>
            </Group>
            <Button 
              variant="subtle" 
              color="red"
              onClick={() => setJoinRequest(null)}
            >
              Cancel Request
            </Button>
          </Stack>
        ) : (
          <>
            <Text size="lg" fw={500}>Join a Room</Text>

            <TextInput
              label="Room Passcode"
              placeholder="Enter 6-character code"
              value={passcode}
              onChange={(e) => handlePasscodeChange(e.target.value)}
              maxLength={6}
              style={{ 
                letterSpacing: '0.25em',
                textTransform: 'uppercase'
              }}
              data-autofocus
            />

            <Button 
              onClick={handleJoin} 
              loading={roomLoading || checkingStatus}
              fullWidth
              disabled={passcode.length !== 6}
            >
              Join Room
            </Button>
          </>
        )}
      </Stack>
    </Card>
  );
}