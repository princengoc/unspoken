import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { roomsService } from '@/services/supabase/rooms';
import type { Room, RoomSettings } from '@/core/game/types';

interface UseRoomReturn {
  room: Room | null;
  loading: boolean;
  error: Error | null;
  createRoom: (name: string, settings?: Partial<RoomSettings>) => Promise<Room>;
  joinRoom: (passcode: string) => Promise<Room>;
  updateSettings: (settings: Partial<RoomSettings>) => Promise<void>;
  leaveRoom: () => Promise<void>;
}

export function useRoom(roomId?: string): UseRoomReturn {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Update cleanup for proper disconnection
  useEffect(() => {
    return () => {
      if (roomId && user?.id) {
        roomsService.updatePlayerStatus(roomId, user.id, false).catch(console.error);
      }
    };
  }, [roomId, user?.id]);

  useEffect(() => {
    let subscription: ReturnType<typeof roomsService.subscribeToRoom>;

    async function loadRoom() {
      if (!roomId) {
        setLoading(false);
        return;
      }

      try {
        const roomData = await roomsService.get(roomId);
        setRoom(roomData);

        // Subscribe to room changes
        subscription = roomsService.subscribeToRoom(roomId, (updatedRoom) => {
          setRoom(updatedRoom);
        });

      } catch (err) {
        console.error('Error loading room:', err); // Debug log
        setError(err instanceof Error ? err : new Error('Failed to load room'));
      } finally {
        setLoading(false);
      }
    }

    loadRoom();

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [roomId]);

  const createRoom = async (name: string, settings?: Partial<RoomSettings>): Promise<Room> => {
    if (!user) throw new Error('Must be logged in to create a room');

    try {
      setLoading(true);
      const newRoom = await roomsService.create(name, user.id, settings);
      setRoom(newRoom);
      return newRoom;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to create room ${JSON.stringify(err)}`);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (passcode: string): Promise<Room> => {
    if (!user) throw new Error('Must be logged in to join a room');

    try {
      setLoading(true);
      const joinedRoom = await roomsService.join(passcode, {
        id: user.id,
        username: null, // Will be populated from profiles
        isOnline: true, 
      });
      setRoom(joinedRoom);
      return joinedRoom;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to join room');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (settings: Partial<RoomSettings>): Promise<void> => {
    if (!room?.id) throw new Error('No active room');
    if (room.created_by !== user?.id) throw new Error('Only room creator can update settings');

    try {
      const updatedRoom = await roomsService.updateSettings(room.id, settings);
      setRoom(updatedRoom);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update settings');
      setError(error);
      throw error;
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!room?.id || !user?.id) return;

    try {
      await roomsService.updatePlayerStatus(room.id, user.id, false);
      setRoom(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave room');
      setError(error);
      throw error;
    }
  };

  return {
    room,
    loading,
    error,
    createRoom,
    joinRoom,
    updateSettings,
    leaveRoom
  };
}