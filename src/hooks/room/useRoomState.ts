import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useRoomAPI } from "@/hooks/room/useRoomAPI";
import { roomMembersService } from "@/services/supabase/roomMembers";
import { roomsService } from "@/services/supabase/rooms";
import {
  Player,
  DEFAULT_PLAYER,
  RoomSettings,
  GameMode,
} from "@/core/game/types";

// Extended room interface to track UI states
interface RoomWithStatus {
  id: string;
  passcode: string;
  created_by: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  status?:
    | "idle"
    | "pending"
    | "approved"
    | "rejected"
    | "creating"
    | "joining";
  game_mode?: GameMode;
  isCreator?: boolean;
  lastUpdated?: Date;
  isNew?: boolean; // Flag for newly created rooms
  phase: string;
  active_player_id: string | null;
}

function convertCardDepth(value: string | null): number | null {
  if (value === null || value === "all") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export const useRoomState = () => {
  type RoomStateReturn = {
    rooms: RoomWithStatus[];
    loadedRoomMembers: Record<string, Player[]>;
    joinCode: string;
    setJoinCode: React.Dispatch<React.SetStateAction<string>>;
    newRoomName: string;
    setNewRoomName: React.Dispatch<React.SetStateAction<string>>;
    cardDepthFilter: string | null;
    setCardDepthFilter: React.Dispatch<React.SetStateAction<string | null>>;
    isAddingRoom: boolean;
    setIsAddingRoom: React.Dispatch<React.SetStateAction<boolean>>;
    isJoiningRoom: boolean;
    setIsJoiningRoom: React.Dispatch<React.SetStateAction<boolean>>;
    isRemote: boolean;
    setIsRemote: React.Dispatch<React.SetStateAction<boolean>>;
    loadActiveRooms: () => Promise<void>;
    handleCreateRoom: (cardDepth: string | null, isRemote: boolean) => Promise<void>;
    handleJoinRoom: () => Promise<void>;
    goToRoom: (roomId: string) => Promise<void>;
    roomAPILoading: boolean;
  };
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [cardDepthFilter, setCardDepthFilter] = useState<string | null>(null);
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isRemote, setIsRemote] = useState(true);

  const {
    findRoomByPasscode,
    joinRoom,
    createRoom,
    loading: roomAPILoading,
  } = useRoomAPI();

  // Use a ref to ensure we only load the count once per room
  const loadedRoomMembers = useRef<Record<string, Player[]>>({});

  // Fetch rooms and update the state
  const loadActiveRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      const activeRooms = await roomsService.fetchActiveRooms(user.id);
      const roomsWithStatus: RoomWithStatus[] = activeRooms.map((room) => ({
        ...room,
        status: "idle",
        isCreator: room.created_by === user.id,
        lastUpdated: new Date(room.updated_at!),
        isNew: false,
      }));

      setRooms(roomsWithStatus);

      // Load members for each room only if not already loaded
      for (const room of activeRooms) {
        if (!loadedRoomMembers.current[room.id]) {
          try {
            const members = await roomMembersService.getRoomMembers(room.id);
            loadedRoomMembers.current[room.id] = members;
          } catch (error) {
            console.error(`Error fetching members for room ${room.id}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching active rooms:", error);
    }
  }, [user]);

  // Check pending join request status
  const checkJoinStatus = useCallback(
    async (roomId: string) => {
      if (!user) return;
      try {
        const request = await roomMembersService.checkJoinRequest(
          roomId,
          user.id,
        );
        const newStatus = request?.status || "idle";

        if (newStatus === "approved") {
          if (!loadedRoomMembers.current[roomId]) {
            const members = await roomMembersService.getRoomMembers(roomId);
            loadedRoomMembers.current[roomId] = members;
          }

          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.id === roomId
                ? {
                    ...room,
                    status: "idle",
                    isNew: true,
                    lastUpdated: new Date(),
                  }
                : room,
            ),
          );
        } else {
          // Update the room with the new status (pending or rejected)
          setRooms((prevRooms) =>
            prevRooms.map((room) =>
              room.id === roomId ? { ...room, status: newStatus } : room,
            ),
          );
        }
        return newStatus;
      } catch (error) {
        console.error("Error checking join status:", error);
        return null;
      }
    },
    [user],
  );

  // Create new room
  const handleCreateRoom = async (
    cardDepth: string | null,
    isRemote: boolean,
  ) => {
    if (!newRoomName.trim() || !user) return;

    // Add a temporary row for the room being created
    const tempRoom: RoomWithStatus = {
      id: "creating",
      passcode: "",
      created_by: user.id,
      name: newRoomName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      status: "creating",
      isCreator: true,
      lastUpdated: new Date(),
      phase: "setup",
      active_player_id: null,
    };

    setRooms((prev) => [...prev, tempRoom]);

    const settings = {
      card_depth: convertCardDepth(cardDepth),
      deal_extras: true,
      game_mode: isRemote ? "remote" : "irl",
    } as RoomSettings;

    try {
      const room = await createRoom(newRoomName.trim(), settings);

      // Members for this new room is just the user itself, save a query
      const currentPlayer = {
        ...DEFAULT_PLAYER,
        id: user.id,
        username: user.username,
      } as Player;
      loadedRoomMembers.current[room.id] = [currentPlayer];

      // Remove temp room and add the real one (with isNew flag for highlighting)
      setRooms((prev) => [
        ...prev.filter((r) => r.id !== "creating"),
        {
          ...room,
          status: "idle",
          isCreator: true,
          lastUpdated: new Date(),
          isNew: true, // Mark as newly created for highlighting
        },
      ]);

      // Reset the form
      setNewRoomName("");
      setIsAddingRoom(false);
    } catch (error) {
      // Remove the temporary room on error
      setRooms((prev) => prev.filter((r) => r.id !== "creating"));
      console.error("Error creating room:", error);
    }
  };

  // Join room with code
  const handleJoinRoom = async () => {
    if (!joinCode.trim() || !user) return;

    setIsJoiningRoom(true);

    try {
      const room = await findRoomByPasscode(joinCode.toUpperCase());

      if (!room) {
        throw new Error("Room not found");
      }

      // Create or update a temporary entry for the room being joined
      const tempRoom: RoomWithStatus = {
        ...room,
        status: "joining",
        isCreator: room.created_by === user.id,
        lastUpdated: new Date(),
      };

      setRooms((prev) => {
        const existing = prev.find((r) => r.id === room.id);
        if (existing) {
          return prev.map((r) => (r.id === room.id ? tempRoom : r));
        }
        return [...prev, tempRoom];
      });

      // If the user is the room creator, join directly.
      if (room.created_by === user.id) {
        await joinRoom(room.id);
        router.push(`/room/${room.id}`);
        return;
      }

      // Check if there's an existing join request.
      const existingRequest = await roomMembersService.checkJoinRequest(
        room.id,
        user.id,
      );

      if (!existingRequest) {
        // Create a new join request if none exists
        await roomMembersService.createJoinRequest(room.id, user.id);
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, status: "pending" } : r)),
        );
      } else {
        // If a join request exists (likely pending), update its status.
        setRooms((prev) =>
          prev.map((r) =>
            r.id === room.id
              ? {
                  ...r,
                  status: existingRequest.status as
                    | "pending"
                    | "approved"
                    | "rejected",
                }
              : r,
          ),
        );
      }

      // Clear form state
      setJoinCode("");
      setIsJoiningRoom(false);
    } catch (error) {
      console.error("Error joining room:", error);
      setIsJoiningRoom(false);
    }
  };

  // Navigate to a room
  const goToRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  // Effect to fetch rooms on load and when user changes
  useEffect(() => {
    if (user) {
      loadActiveRooms();
    }
  }, [user, loadActiveRooms]);

  // Effect to check join status periodically for pending rooms
  useEffect(() => {
    const pendingRoomIds = rooms
      .filter((room) => room.status === "pending")
      .map((room) => room.id);

    if (pendingRoomIds.length > 0) {
      const interval = setInterval(() => {
        pendingRoomIds.forEach((roomId) => checkJoinStatus(roomId));
      }, 5000);

      return () => clearInterval(interval);
    }

    return undefined; // if pendingRoomIds.length === 0
  }, [rooms, checkJoinStatus]);

  return {
    rooms,
    loadedRoomMembers: loadedRoomMembers.current,
    joinCode,
    setJoinCode,
    newRoomName,
    setNewRoomName,
    cardDepthFilter,
    setCardDepthFilter,
    isAddingRoom,
    setIsAddingRoom,
    isJoiningRoom,
    setIsJoiningRoom,
    isRemote,
    setIsRemote,
    loadActiveRooms,
    handleCreateRoom,
    handleJoinRoom,
    goToRoom,
    roomAPILoading,
  } as RoomStateReturn;
};