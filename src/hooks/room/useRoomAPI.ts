import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { roomsService } from '@/services/supabase/rooms';
import type { Room, RoomSettings } from '@/core/game/types';

interface UseRoomReturn {
  loading: boolean;
  error: Error | null;
  findRoomByPasscode: (passcode: string) => Promise<Room>;
  findPasscodeByRoom: (roomId: string) => Promise<string>;
  createRoom: (name: string, settings?: Partial<RoomSettings>) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<Room>;
}

// Manages the room creation and joining and searching: all operations before we have a Room object
export function useRoomAPI(): UseRoomReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRoom = async (name: string, settings?: Partial<RoomSettings>): Promise<Room> => {
    if (!user) throw new Error('Must be logged in to create a room');

    try {
      setLoading(true);
      const newRoom = await roomsService.create(name, user.id, settings);
      return newRoom;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to create room ${JSON.stringify(err)}`);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const findPasscodeByRoom = async (roomId: string): Promise<string> => {
    const passcode = await roomsService.findPasscodeByRoom(roomId); 
    if (!passcode) throw new Error(`Passcode not found for room with ID ${roomId}`);
    return passcode
  };

  const findRoomByPasscode = async (passcode: string): Promise<Room> => {
    const room = await roomsService.findRoomByPasscode(passcode);
    if (!room) throw new Error('Room not found');
    return room;
  };

  const joinRoom = async (roomId: string): Promise<Room> => {
    if (!user) throw new Error('Must be logged in to join a room');

    try {
      setLoading(true);
      const joinedRoom = await roomsService.join(roomId, user.id);
      return joinedRoom;
    } catch (err) {
      console.error(`Join room error: ${JSON.stringify(err)}`);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    findRoomByPasscode,
    findPasscodeByRoom,
    createRoom,
    joinRoom,
  };
}