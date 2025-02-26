// Context provider for the room object alone, source of truth for room and its derived fields (Eg game state)
// Requires that we already have a RoomId. Deals with service subscription and updates
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthProvider";
import { roomsService } from "@/services/supabase/rooms";
import { roomMembersService } from "@/services/supabase/roomMembers";
import type {
  Room,
  GameState,
  GamePhase,
  RoomSettings,
} from "@/core/game/types";

// Context Type
interface RoomContextType {
  room: Room | null;
  loading: boolean;
  error: Error | null;
  leaveRoom: () => Promise<void>;
  updateRoom: (updates: Partial<Room>) => Promise<void>;
  finishSpeaking: (speakerId: string, isRemote?: boolean) => Promise<void>;
  startNextRound: (
    creatorId: string,
    settings: Partial<RoomSettings>,
  ) => Promise<void>;
  startSpeakingPhase: (creatorId: string, isRemote?: boolean) => Promise<void>;
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
        console.error("Error loading room:", err);
        if (isMounted)
          setError(
            err instanceof Error ? err : new Error("Failed to load room"),
          );
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

  const updateRoom = useCallback(
    async (updates: Partial<Room>): Promise<void> => {
      if (!room?.id) throw new Error("No active room");

      const hasNonGameStateUpdates = Object.keys(updates).some(
        (key) => !(key in ({} as GameState)),
      );

      if (hasNonGameStateUpdates && room.created_by !== user?.id) {
        throw new Error(
          `Updates ${JSON.stringify(updates)} has fields that only creator can update.`,
        );
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
        setError(
          err instanceof Error
            ? err
            : new Error(
                `Failed to update room: ${JSON.stringify(err)} with updates: ${JSON.stringify(updates)}`,
              ),
        );
        throw err;
      }
    },
    [room, user],
  );

  // TODO: leaveRoom should probably be a simpler function
  const leaveRoom = useCallback(async (): Promise<void> => {
    if (!room?.id || !user?.id) return;

    try {
      await roomMembersService.updatePlayerState(room.id, user.id, {
        is_online: false,
      });
      setRoom(null);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to leave room");
      setError(error);
      throw error;
    }
  }, [room, user]);

  const finishSpeaking = useCallback(
    async (speakerId: string, isRemote?: boolean) => {
      if (!room?.id) throw new Error("No active room");
  
      try {
        if (isRemote) {
          // For remote mode, the creator can end the reviewing phase
          // This moves directly to endgame without active_player_id rotation
          await roomsService.finishRemoteSpeaking(room.id, speakerId);
          
          // Optimistically update room state
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "endgame" as GamePhase,
                  active_player_id: null,
                }
              : null
          );
        } else {
          // Original behavior for IRL mode
          const { next_phase, next_speaker_id } =
            await roomsService.finishSpeaking(room.id, speakerId);
  
          // Optimistically update room state before the subscription effect
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  phase: next_phase,
                  active_player_id: next_speaker_id,
                }
              : null
          );
        }
      } catch (error) {
        console.error("Failed to finish speaking:", error);
        throw error;
      }
    },
    [room?.id]
  );

  const startSpeakingPhase = useCallback(
    async (creatorId: string, isRemote?: boolean) => {
      if (!room?.id) throw new Error("No active room");
  
      try {
        if (isRemote) {
          // For remote mode, just update the phase without selecting a speaker
          await roomsService.startRemoteSpeakingPhase(room.id, creatorId);
          
          // Optimistically update room state
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  phase: "speaking" as GamePhase,
                  active_player_id: null, // No active player in remote mode
                }
              : null
          );
        } else {
          // Original behavior for IRL mode
          const { next_phase, first_speaker_id } =
            await roomsService.startSpeakingPhase(room.id, creatorId);
  
          // Optimistically update room state before the subscription effect
          setRoom((prev) =>
            prev
              ? {
                  ...prev,
                  phase: next_phase,
                  active_player_id: first_speaker_id,
                }
              : null
          );
        }
      } catch (error) {
        console.error("Failed to start speaking phase:", error);
        throw error;
      }
    },
    [room?.id]
  );

  const startNextRound = useCallback(
    async (creatorId: string, settings: Partial<RoomSettings>) => {
      if (!room?.id) throw new Error("No active room");

      const nextPhase = await roomsService.startNextRound(
        room.id,
        creatorId,
        settings,
      );

      // Optimistically update room state
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              phase: nextPhase as GamePhase,
              active_player_id: null,
              ...settings,
            }
          : null,
      );
    },
    [room?.id],
  );

  const value = useMemo(
    () => ({
      room,
      loading,
      error,
      updateRoom,
      leaveRoom,
      finishSpeaking,
      startNextRound,
      startSpeakingPhase,
    }),
    [
      room,
      loading,
      error,
      updateRoom,
      leaveRoom,
      finishSpeaking,
      startNextRound,
      startSpeakingPhase,
    ],
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
