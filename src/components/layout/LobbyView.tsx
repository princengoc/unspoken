import {
  Container,
  Button,
  Stack,
  Text,
  Group,
  Menu,
  Card,
  TextInput,
  Badge,
  ActionIcon,
  Loader,
  CopyButton,
  Tooltip,
  Switch,
  NativeSelect,
  SimpleGrid,
  Box,
  Transition,
  Paper,
  Modal,
  Drawer,
  Center,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconCheck,
  IconCopy,
  IconRefresh,
  IconUsers,
  IconCrown,
  IconHourglass,
  IconMessageCircle,
  IconCards,
  IconPlus,
  IconArrowRight,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";
import { formatRelativeTime } from "@/core/game/utils";
import { UnspokenGameTitle } from "@/core/game/unspokenIcon";
import { ProfileSettings } from "@/app/auth/ProfileSettings";

// RoomCard component for displaying individual rooms
const RoomCard = ({ room, onJoin, loadedRoomMembers }: any) => {
  // Return appropriate badge based on room phase
  const getRoomPhaseIcon = (phase: string) => {
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

  const renderRoomStatusIcon = (room: any) => {
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

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{
        backgroundColor: room.isNew ? "rgba(173, 216, 230, 0.1)" : undefined,
        transition: "all 0.3s ease",
        transform: room.isNew ? "translateY(0)" : "translateY(0)",
        boxShadow: room.isNew
          ? "0 8px 20px rgba(0, 123, 255, 0.15)"
          : "0 2px 10px rgba(0, 0, 0, 0.05)",
      }}
      h={250}
    >
      <Card.Section
        bg={room.game_mode === "remote" ? "orange.4" : "blue.4"}
        p="xs"
      >
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={500} c="white" size="lg">
              {room.name}
            </Text>
            {room.isCreator && (
              <Tooltip label="You created this room">
                <ActionIcon color="yellow" variant="transparent">
                  <IconCrown size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          <Badge
            variant="light"
            color={room.game_mode === "remote" ? "orange" : "blue"}
          >
            {room.game_mode === "remote" ? "Remote" : "In-Person"}
          </Badge>
        </Group>
      </Card.Section>

      <Stack mt="md" gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Passcode:
          </Text>
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
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              )}
            </CopyButton>
          </Group>
        </Group>

        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Status:
          </Text>
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
            <Badge
              size="sm"
              variant="light"
              color={
                room.status === "pending"
                  ? "orange"
                  : room.status === "rejected"
                    ? "red"
                    : "blue"
              }
              leftSection={renderRoomStatusIcon(room)}
            >
              {room.status === "pending"
                ? "Pending"
                : room.status === "rejected"
                  ? "Rejected"
                  : room.phase}
            </Badge>
          </Tooltip>
        </Group>

        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Players:
          </Text>
          <Tooltip
            label={
              loadedRoomMembers[room.id]
                ? loadedRoomMembers[room.id]
                    .map((m: any) => m.username || "Unnamed user")
                    .join(", ")
                : "Loading members..."
            }
          >
            <Group gap="xs" wrap="nowrap">
              <IconUsers size={16} />
              <Text size="sm">
                {loadedRoomMembers[room.id]?.length || "..."}
              </Text>
            </Group>
          </Tooltip>
        </Group>

        <Group justify="space-between">
          <Text size="sm" fw={500}>
            Last activity:
          </Text>
          <Text size="sm" c="dimmed">
            {room.lastUpdated ? formatRelativeTime(room.lastUpdated) : "—"}
          </Text>
        </Group>
      </Stack>

      <Group justify="right" mt="md">
        {room.status === "creating" || room.status === "joining" ? (
          <Loader size="sm" />
        ) : room.status === "pending" ? (
          <Badge size="sm" color="blue">
            Waiting for approval...
          </Badge>
        ) : room.status === "rejected" ? (
          <Badge size="sm" color="red">
            Join request declined
          </Badge>
        ) : (
          <Button
            rightSection={<IconArrowRight size={16} />}
            onClick={() => onJoin(room.id)}
            variant="light"
          >
            Join Game
          </Button>
        )}
      </Group>
    </Card>
  );
};

// Create Room Modal
const CreateRoomModal = ({
  opened,
  onClose,
  newRoomName,
  setNewRoomName,
  cardDepthFilter,
  setCardDepthFilter,
  isRemote,
  setIsRemote,
  handleCreateRoom,
}: any) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Game Room"
      centered
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Room Name"
          placeholder="Enter a name for your game room"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          required
        />

        <NativeSelect
          label="Card Depth Filter"
          description="Choose the depth level of cards for your game"
          value={cardDepthFilter ? cardDepthFilter : "all"}
          onChange={(event) => setCardDepthFilter(event.currentTarget.value)}
          data={[
            { value: "0", label: "U13" },
            { value: "1", label: "neighbors" },
            { value: "2", label: "friends" },
            { value: "3", label: "besties" },
            { value: "all", label: "allow all" },
          ]}
        />

        <Switch
          label="Remote Play Mode"
          description="Enable for remote gameplay, disable for in-person games"
          checked={isRemote}
          onChange={(event) => setIsRemote(event.currentTarget.checked)}
        />

        <Group justify="right" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleCreateRoom(cardDepthFilter, isRemote);
              onClose();
            }}
            disabled={!newRoomName.trim()}
          >
            Create Room
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

// Join Room Modal
const JoinRoomModal = ({
  opened,
  onClose,
  joinCode,
  setJoinCode,
  handleJoinRoom,
}: any) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Join Game Room"
      centered
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Room Code"
          placeholder="Enter the 6-digit room code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
          required
          description="You'll need to be approved by the room creator"
        />

        <Group justify="right" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleJoinRoom();
              onClose();
            }}
            disabled={!joinCode || joinCode.length < 6}
          >
            Join Room
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

// Main LobbyView component
interface LobbyViewProps {
  visible: boolean;
  user: any;
  loading: boolean;
  rooms: any[];
  joinCode: string;
  setJoinCode: (code: string) => void;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  cardDepthFilter: string | null;
  setCardDepthFilter: (filter: string) => void;
  isAddingRoom: boolean;
  setIsAddingRoom: (isAdding: boolean) => void;
  isJoiningRoom: boolean;
  setIsJoiningRoom: (isJoining: boolean) => void;
  isRemote: boolean;
  setIsRemote: (isRemote: boolean) => void;
  loadActiveRooms: () => void;
  handleCreateRoom: (cardDepth: string | null, isRemote: boolean) => void;
  handleJoinRoom: () => void;
  goToRoom: (roomId: string) => void;
  roomAPILoading: boolean;
  onLogin: () => void;
  loadedRoomMembers?: Record<string, any[]>;
  onLogout: () => void;
}

const LobbyView = ({
  visible,
  user,
  loading,
  rooms,
  joinCode,
  setJoinCode,
  newRoomName,
  setNewRoomName,
  cardDepthFilter,
  setCardDepthFilter,
  isRemote,
  setIsRemote,
  loadActiveRooms,
  handleCreateRoom,
  handleJoinRoom,
  goToRoom,
  roomAPILoading,
  onLogin,
  onLogout,
  loadedRoomMembers,
}: LobbyViewProps) => {
  // Use Mantine's useDisclosure hook for modal states
  const [createModalOpened, createModalHandlers] = useDisclosure(false);
  const [joinModalOpened, joinModalHandlers] = useDisclosure(false);

  const [profileOpened, { open: openProfile, close: closeProfile }] =
    useDisclosure(false);

  return (
    <Transition
      mounted={visible}
      transition="slide-up"
      duration={400}
      timingFunction="ease"
    >
      {(styles) => (
        <Box
          style={{
            ...styles,
            minHeight: "100vh",
            position: "relative",
            paddingTop: rem(100),
            paddingBottom: rem(100),
            top: 0,
          }}
        >
          <Container size="xl">
            <Stack gap="xl">
              <Paper p="md" radius="md">
                <Group justify="space-between">
                  <UnspokenGameTitle order={2} />

                  <Group>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={loadActiveRooms}
                      disabled={roomAPILoading}
                      title="Refresh"
                    >
                      <IconRefresh size={18} />
                    </ActionIcon>

                    {user ? (
                      <Menu position="bottom-end" shadow="md">
                        <Menu.Target>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="lg"
                            radius="xl"
                            title="User Settings"
                          >
                            <IconUser size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>{user.username || "You"}</Menu.Label>
                          <Menu.Item
                            leftSection={<IconUser size={14} />}
                            onClick={openProfile}
                          >
                            Profile Settings
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconLogout size={14} />}
                            color="purple"
                            onClick={onLogout}
                          >
                            Sign Out
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    ) : (
                      <Button>Log in</Button>
                    )}
                  </Group>
                </Group>
              </Paper>

              {!user ? (
                <Center style={{ padding: "100px 0" }}>
                  <Stack align="center" gap="md">
                    <Text size="xl" fw={500}>
                      Login to see and join games
                    </Text>
                    <Button size="lg" onClick={onLogin} loading={loading}>
                      Login to Play
                    </Button>
                  </Stack>
                </Center>
              ) : (
                <>
                  {/* Action Buttons */}
                  <Group justify="center" gap="md">
                    <Button
                      size="md"
                      leftSection={<IconPlus size={20} />}
                      onClick={createModalHandlers.open}
                    >
                      Create New Room
                    </Button>

                    <Button
                      size="md"
                      variant="light"
                      leftSection={<IconUsers size={20} />}
                      onClick={joinModalHandlers.open}
                    >
                      Join with Code
                    </Button>
                  </Group>

                  {/* Rooms Grid */}
                  {roomAPILoading && rooms.length === 0 ? (
                    <Center style={{ padding: "50px 0" }}>
                      <Loader size="xl" />
                    </Center>
                  ) : rooms.length === 0 ? (
                    <Paper
                      withBorder
                      p="xl"
                      radius="md"
                      style={{
                        textAlign: "center",
                        padding: "50px 20px",
                        background: "rgba(0, 0, 0, 0.03)",
                      }}
                    >
                      <Stack align="center" gap="md">
                        <IconCards size={48} stroke={1.5} color="gray" />
                        <Text size="xl" fw={500}>
                          No Active Game Rooms
                        </Text>
                        <Text color="dimmed" size="md">
                          Create a new room or join an existing one with a room
                          code.
                        </Text>
                        <Button
                          onClick={createModalHandlers.open}
                          leftSection={<IconPlus size={20} />}
                          mt="md"
                        >
                          Create Your First Room
                        </Button>
                      </Stack>
                    </Paper>
                  ) : (
                    <SimpleGrid
                      cols={{ base: 1, sm: 1, md: 2, lg: 3 }}
                      spacing={{ base: "sm", sm: "sm", md: "md", lg: "lg" }}
                    >
                      {rooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onJoin={goToRoom}
                          loadedRoomMembers={loadedRoomMembers || {}}
                        />
                      ))}
                    </SimpleGrid>
                  )}
                </>
              )}
            </Stack>
          </Container>

          {/* Modals */}
          <CreateRoomModal
            opened={createModalOpened}
            onClose={createModalHandlers.close}
            newRoomName={newRoomName}
            setNewRoomName={setNewRoomName}
            cardDepthFilter={cardDepthFilter}
            setCardDepthFilter={setCardDepthFilter}
            isRemote={isRemote}
            setIsRemote={setIsRemote}
            handleCreateRoom={handleCreateRoom}
          />

          <JoinRoomModal
            opened={joinModalOpened}
            onClose={joinModalHandlers.close}
            joinCode={joinCode}
            setJoinCode={setJoinCode}
            handleJoinRoom={handleJoinRoom}
          />

          {/* Profile Modal */}
          <Drawer
            opened={profileOpened}
            onClose={closeProfile}
            title="Profile Settings"
            size="md"
            position="right"
          >
            <ProfileSettings />
          </Drawer>
        </Box>
      )}
    </Transition>
  );
};

export default LobbyView;
