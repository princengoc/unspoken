// Context provider for the room object alone, source of truth for room and its derived fields (Eg game state)
// Requires that we already have a RoomId. Deals with service subscription and updates
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { roomsService } from '@/services/supabase/rooms';
import { roomMembersService } from '@/services/supabase/roomMembers';
import type { Room, GameState } from '@/core/game/types';

// Context Type
interface RoomContextType {
  room: Room | null;
  loading: boolean;
  error: Error | null;
  leaveRoom: () => Promise<void>;
  updateRoom: (updates: Partial<Room>) => Promise<void>;
}

interface RoomProviderProps {
  roomId?: string;
  children: ReactNode;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ roomId, children }: RoomProviderProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let subscription: ReturnType<typeof roomsService.subscribeToRoom>;
    let isMounted = true;

    const loadRoom = async () => {
      try {
        const roomData = await roomsService.get(roomId);
        if (isMounted) setRoom(roomData);

        subscription = roomsService.subscribeToRoom(roomId, (updatedRoom) => {
          if (isMounted) setRoom(updatedRoom);
        });
      } catch (err) {
        console.error('Error loading room:', err);
        if (isMounted) setError(err instanceof Error ? err : new Error('Failed to load room'));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoom();

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [roomId]);

  const updateRoom = useCallback(async (updates: Partial<Room>): Promise<void> => {
    if (!room?.id) throw new Error('No active room');
  
    const hasNonGameStateUpdates = Object.keys(updates).some(key => !(key in ({} as GameState)));
  
    if (hasNonGameStateUpdates && room.created_by !== user?.id) {
      throw new Error(`Updates ${JSON.stringify(updates)} has fields that only creator can update.`);
    }
  
    const previousRoom = room; // Keep reference for rollback in case of error
    const updatedRoom = { ...room, ...updates };
    setRoom(updatedRoom);
  
    try {
      await roomsService.updateRoom(room.id, updates);
    } catch (err) {
      // ❗ Rollback on error
      console.error(`Update room error: ${JSON.stringify(err)}`);
      setRoom(previousRoom); // Revert to previous state
      setError(err instanceof Error ? err : new Error(`Failed to update room: ${JSON.stringify(err)} with updates: ${JSON.stringify(updates)}`));
      throw err;
    }
  }, [room, user]);
  
  // TODO: leaveRoom should probably be a simpler function
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!room?.id || !user?.id) return;

    try {
      await roomMembersService.updatePlayerState(room.id, user.id, { isOnline: false });
      setRoom(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to leave room');
      setError(error);
      throw error;
    }
  }, [room, user]);

  const value = useMemo(() => ({
    room,
    loading,
    error,
    updateRoom,
    leaveRoom
  }), [room, loading, error, updateRoom, leaveRoom]);

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}
