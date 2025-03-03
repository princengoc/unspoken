"use client";

import { useAuth } from "@/context/AuthProvider";
import {
  Container,
  Button,
  Stack,
  Text,
  Group,
  Card,
  TextInput,
  Table,
  Badge,
  ActionIcon,
  Loader,
  CopyButton,
  Tooltip,
  Switch,
  Select,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRoomAPI } from "@/hooks/room/useRoomAPI";
import { roomMembersService } from "@/services/supabase/roomMembers";
import {
  IconCheck,
  IconCopy,
  IconRefresh,
  IconUsers,
  IconCrown,
} from "@tabler/icons-react";
import {
  IconHourglass,
  IconMessageCircle,
  IconCards,
} from "@tabler/icons-react";
import {
  Player,
  GamePhase,
  RoomMetaDataAndState,
  DEFAULT_PLAYER,
  RoomSettings,
  GameMode,
} from "@/core/game/types";
import { roomsService } from "@/services/supabase/rooms";
import { UnspokenGameTitle } from "@/core/game/unspokenIcon";
import { formatRelativeTime } from "@/core/game/utils";

// Extended room interface to track UI states
interface RoomWithStatus extends RoomMetaDataAndState {
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
}

function convertCardDepth(value: string | null): number | null {
  if (value === null || value === "all") return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

export default function Home() {
  const { user, loading } = useAuth();
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
    console.log(`Is remote: ${isRemote}`);
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

  // Return appropriate badge based on room phase
  const getRoomPhaseIcon = (phase: GamePhase) => {
    switch (phase) {
      case "setup":
        return <IconHourglass size={16} />;
      case "speaking":
        return <IconMessageCircle size={16} />;
      case "endgame":
        return <IconCards size={16} />;
      default:
        return <IconHourglass size={16} />;
    }
  };

  const renderRoomStatusIcon = (room: RoomWithStatus) => {
    if (room.status === "creating" || room.status === "joining") {
      return <Loader size="xs" />;
    } else if (room.status === "pending") {
      return <IconHourglass size={16} color="orange" />;
    } else if (room.status === "rejected") {
      return <IconHourglass size={16} color="red" />;
    } else {
      // Return icon based on game phase
      return getRoomPhaseIcon(room.phase);
    }
  };

  const renderRoomActionButton = (room: RoomWithStatus) => {
    if (room.status === "creating" || room.status === "joining") {
      return <Loader size="xs" />;
    } else if (room.status === "pending") {
      return (
        <Badge size="sm" color="blue">
          Waiting...
        </Badge>
      );
    } else if (room.status === "rejected") {
      return (
        <Badge size="sm" color="gray">
          Declined
        </Badge>
      );
    } else {
      return (
        <Button size="xs" onClick={() => goToRoom(room.id)}>
          Join Now
        </Button>
      );
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="xs" ta="center" align="center">
          <UnspokenGameTitle />
          <Text size="lg" c="gray.6" fw={500}>
            A game of cards, a journey of words.
          </Text>
        </Stack>

        {!user ? (
          <Button
            size="lg"
            onClick={() => router.push("/auth")}
            loading={loading}
            mx="auto"
            mt="md"
          >
            Login to Play
          </Button>
        ) : (
          <>
            {/* Unified Rooms Table */}
            <Card withBorder shadow="sm" radius="md" p="md" mt="sm">
              <Group justify="space-between" mb="md">
                <Text fw={500}>Game Rooms</Text>
                <Group>
                  <ActionIcon
                    variant="subtle"
                    onClick={loadActiveRooms}
                    disabled={roomAPILoading}
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>
                </Group>
              </Group>

              {roomAPILoading && rooms.length === 0 ? (
                <Stack align="center" py="md">
                  <Loader size="sm" />
                </Stack>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Room Name</Table.Th>
                      <Table.Th>Passcode</Table.Th>
                      <Table.Th>Room Info</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rooms.map((room) => (
                      <Table.Tr
                        key={room.id}
                        style={{
                          backgroundColor: room.isNew
                            ? "rgba(173, 216, 230, 0.2)"
                            : undefined,
                          transition: "background-color 0.5s ease",
                        }}
                      >
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip
                              label={
                                room.game_mode === "remote"
                                  ? "remote"
                                  : "in-person"
                              }
                            >
                              <Text
                                fw={500}
                                c={
                                  room.game_mode === "remote"
                                    ? "orange"
                                    : "blue"
                                }
                              >
                                {room.name}
                              </Text>
                            </Tooltip>
                            {room.isCreator && (
                              <Tooltip label="You created this room">
                                <ActionIcon
                                  color="yellow"
                                  variant="transparent"
                                >
                                  <IconCrown size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Text
                              fw={600}
                              style={{
                                fontFamily: "monospace",
                                letterSpacing: "0.1em",
                              }}
                            >
                              {room.passcode}
                            </Text>
                            <CopyButton value={room.passcode} timeout={2000}>
                              {({ copied, copy }) => (
                                <ActionIcon
                                  color={copied ? "teal" : "gray"}
                                  onClick={copy}
                                  size="sm"
                                >
                                  {copied ? (
                                    <IconCheck size={16} />
                                  ) : (
                                    <IconCopy size={16} />
                                  )}
                                </ActionIcon>
                              )}
                            </CopyButton>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip
                            label={
                              room.status === "pending"
                                ? "Awaiting Approval"
                                : room.status === "rejected"
                                  ? "Rejected"
                                  : room.phase === "setup"
                                    ? "Setup Phase"
                                    : room.phase === "speaking"
                                      ? "Speaking Phase"
                                      : room.phase === "endgame"
                                        ? "Encore Phase"
                                        : "Unknown"
                            }
                          >
                            <Group gap="sm">
                              {renderRoomStatusIcon(room)}

                              <Tooltip
                                label={
                                  loadedRoomMembers.current[room.id]
                                    ? loadedRoomMembers.current[room.id]
                                        .map(
                                          (m) => m.username || "Unnamed user",
                                        )
                                        .join(", ")
                                    : "Loading members..."
                                }
                              >
                                <Group gap="xs" wrap="nowrap">
                                  <IconUsers size={16} />
                                  <Text size="sm">
                                    {loadedRoomMembers.current[room.id]
                                      ?.length || "..."}
                                  </Text>
                                </Group>
                              </Tooltip>

                              <Text size="sm" c="dimmed">
                                {room.lastUpdated
                                  ? formatRelativeTime(room.lastUpdated)
                                  : "—"}
                              </Text>
                            </Group>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td>{renderRoomActionButton(room)}</Table.Td>
                      </Table.Tr>
                    ))}

                    {/* Create Room Row */}
                    {isAddingRoom && (
                      <Table.Tr>
                        <Table.Td>
                          <TextInput
                            placeholder="Room name"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                            size="xs"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text fs="italic" size="sm" c="dimmed">
                            Will be generated
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Select
                              placeholder="Card depth filter"
                              value={cardDepthFilter}
                              onChange={setCardDepthFilter}
                              data={[
                                { value: "0", label: "U13" },
                                { value: "1", label: "neighbors" },
                                { value: "2", label: "friends" },
                                { value: "3", label: "besties" },
                                { value: "all", label: "allow all" },
                              ]}
                              size="xs"
                            />
                            <Switch
                              label="Remote mode"
                              checked={isRemote}
                              onChange={(event) =>
                                setIsRemote(event.currentTarget.checked)
                              }
                              size="xs"
                            />
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              onClick={() =>
                                handleCreateRoom(cardDepthFilter, isRemote)
                              }
                              disabled={!newRoomName.trim()}
                            >
                              Create
                            </Button>
                            <Button
                              size="xs"
                              variant="subtle"
                              onClick={() => {
                                setIsAddingRoom(false);
                                setNewRoomName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )}

                    {/* Join Room Row */}
                    {isJoiningRoom && (
                      <Table.Tr>
                        <Table.Td>
                          <Text fs="italic" size="sm" c="dimmed">
                            Will be loaded
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            placeholder="Enter room code"
                            value={joinCode}
                            onChange={(e) =>
                              setJoinCode(e.target.value.toUpperCase())
                            }
                            size="xs"
                            maxLength={6}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Badge color="blue">Joining</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              size="xs"
                              onClick={handleJoinRoom}
                              disabled={!joinCode || joinCode.length < 6}
                            >
                              Join
                            </Button>
                            <Button
                              size="xs"
                              variant="subtle"
                              onClick={() => {
                                setIsJoiningRoom(false);
                                setJoinCode("");
                              }}
                            >
                              Cancel
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              )}

              {rooms.length === 0 &&
                !isAddingRoom &&
                !isJoiningRoom &&
                !roomAPILoading && (
                  <Text ta="center" c="dimmed" py="md">
                    Create or Join a room to get started.
                  </Text>
                )}

              {/* Table actions */}
              <Group mt="md" gap="xs" justify="center">
                {!isAddingRoom && (
                  <Button
                    leftSection={<IconCrown size={16} />}
                    onClick={() => {
                      setIsAddingRoom(true);
                      setIsJoiningRoom(false);
                    }}
                    size="sm"
                  >
                    Create Room
                  </Button>
                )}

                {!isJoiningRoom && (
                  <Button
                    leftSection={<IconUsers size={16} />}
                    onClick={() => {
                      setIsJoiningRoom(true);
                      setIsAddingRoom(false);
                    }}
                    variant="light"
                    size="sm"
                  >
                    Join Room
                  </Button>
                )}
              </Group>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}
