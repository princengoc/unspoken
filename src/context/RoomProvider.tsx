// Context provider for the room object alone, source of truth for room and its derived fields (Eg game state)
// Requires that we already have a RoomId. Deals with service subscription and updates
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { roomsService } from "@/services/supabase/rooms";
import { roomMembersService } from "@/services/supabase/roomMembers";
import type { Room, GamePhase, RoomSettings } from "@/core/game/types";
import { RealtimeChannel } from "@supabase/supabase-js";

// Context Type
interface RoomContextType {
  room: Room | null;
  loading: boolean;
  error: Error | null;
  leaveRoom: () => Promise<void>;
  leaveRoomPermanently: (newOwnerId: string | null) => Promise<void>;
  finishSpeaking: () => Promise<void>;
  startNextRound: (settings: Partial<RoomSettings>) => Promise<void>;
  startSpeakingPhase: () => Promise<void>;

  // states
  isCreator: boolean;
}

interface RoomProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ roomId, userId, children }: RoomProviderProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to track subscription to ensure proper cleanup
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // convenient states that can be derived from roomId and userId
  const isRemote = room?.game_mode === "remote";
  const isCreator = userId === room?.created_by;

  useEffect(() => {
    setLoading(true);
    setError(null);
    let isMounted = true;

    const loadRoom = async () => {
      try {
        // Clean up any existing subscription first
        if (subscriptionRef.current) {
          await subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }

        const roomData = await roomsService.get(roomId);
        if (isMounted) {
          setRoom(roomData);
        }

        // Only subscribe if component is still mounted
        if (isMounted) {
          subscriptionRef.current = roomsService.subscribeToRoom(
            roomId,
            (updatedRoom) => {
              if (isMounted) {
                setRoom(updatedRoom);
              }
            },
          );
        }
      } catch (err) {
        console.error("Error loading room:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to load room"),
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRoom();

    // Cleanup function
    return () => {
      isMounted = false;

      // Clean up subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe().catch((err) => {
          console.warn("Error unsubscribing from room:", err);
        });
        subscriptionRef.current = null;
      }
    };
  }, [roomId]);

  // Also clean up on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe().catch((err) => {
          console.warn("Error unsubscribing from room on unmount:", err);
        });
        subscriptionRef.current = null;
      }
    };
  }, []);

  const leaveRoom = useCallback(async (): Promise<void> => {
    await roomMembersService.updatePlayerState(roomId, userId, {
      is_online: false,
    });
    setRoom(null);
  }, [roomId, userId]);

  const leaveRoomPermanently = useCallback(
    async (newOwnerId: string | null): Promise<void> => {
      try {
        await roomMembersService.leaveRoomPermanently(
          roomId,
          userId,
          newOwnerId,
        );
        setRoom(null);
      } catch (err) {
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to permanently leave room");
        setError(error);
        throw error;
      }
    },
    [roomId, userId],
  );

  const finishSpeaking = useCallback(async () => {
    try {
      if (isRemote) {
        // For remote mode, the creator can end the reviewing phase
        // This moves directly to endgame without active_player_id rotation
        await roomsService.finishRemoteSpeaking(roomId, userId);

        // Optimistically update room state
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                phase: "endgame" as GamePhase,
                active_player_id: null,
              }
            : null,
        );
      } else {
        // Original behavior for IRL mode
        const { next_phase, next_speaker_id } =
          await roomsService.finishSpeaking(roomId, userId);

        // Optimistically update room state before the subscription effect
        setRoom((prev) =>
          prev
            ? {
                ...prev,
                phase: next_phase,
                active_player_id: next_speaker_id,
              }
            : null,
        );
      }
    } catch (error) {
      console.error("Failed to finish speaking:", error);
      throw error;
    }
  }, [roomId, userId, isRemote]);

  // NOTE: this should only be called by creator
  const startSpeakingPhase = useCallback(async () => {
    try {
      let next_active_player: string | null;
      let next_game_phase: GamePhase;
      if (isRemote) {
        // For remote mode, just update the phase without selecting a speaker
        await roomsService.startRemoteSpeakingPhase(roomId, userId);
        next_active_player = null;
        next_game_phase = "speaking" as GamePhase;
      } else {
        // Original behavior for IRL mode
        const { next_phase, first_speaker_id } =
          await roomsService.startSpeakingPhase(roomId, userId);
        next_game_phase = next_phase;
        next_active_player = first_speaker_id;
      }
      // Optimistically update room state
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              phase: next_game_phase,
              active_player_id: next_active_player,
            }
          : null,
      );
    } catch (error) {
      console.error("Failed to start speaking phase:", error);
      throw error;
    }
  }, [roomId, userId, isRemote]);

  // remote function already deals with the case of remote vs irl
  const startNextRound = useCallback(
    async (settings: Partial<RoomSettings>) => {
      const nextPhase = await roomsService.startNextRound(
        roomId,
        userId,
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
    [userId, roomId, isRemote],
  );

  const value = useMemo(
    () => ({
      room,
      loading,
      error,
      leaveRoom,
      finishSpeaking,
      startNextRound,
      startSpeakingPhase,
      leaveRoomPermanently,
      isCreator,
    }),
    [
      room,
      loading,
      error,
      leaveRoom,
      finishSpeaking,
      startNextRound,
      startSpeakingPhase,
      leaveRoomPermanently,
      isCreator,
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
