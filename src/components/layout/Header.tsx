// src/components/layout/Header.tsx

import React, { useMemo } from "react";
import {
  Box,
  Group,
  ActionIcon,
  Tooltip,
  Indicator,
  Badge,
  Menu,
  Drawer,
  Title,
} from "@mantine/core";
import {
  IconDoorExit,
  IconHourglass,
  IconMessageCircle,
  IconCards,
  IconCheck,
  IconExchange,
  IconUser,
} from "@tabler/icons-react";
import { JoinRequests } from "@/hooks/room/JoinRequests";
import { SetupViewType, type GamePhase } from "@/core/game/types";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useExchanges } from "@/context/ExchangesProvider";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { getPlayerAssignments } from "@/components/game/statusBarUtils";
import { ProfileSettings } from "@/app/auth/ProfileSettings";
import { useFullRoom } from "@/context/FullRoomProvider";
import { useDisclosure } from "@mantine/hooks";

interface HeaderProps {
  roomId: string;
  gamePhase: GamePhase;
  handleLeaveRoom?: () => void;
  onViewChange?: (view: SetupViewType) => void;
}

export function Header({
  roomId,
  gamePhase,
  handleLeaveRoom,
  onViewChange,
}: HeaderProps) {
  const { members, currentMember } = useRoomMembers();
  const { isCreator, currentMemberStatus } = useFullRoom();
  const playerAssignments = getPlayerAssignments(members, roomId);
  const [profileOpened, { open: openProfile, close: closeProfile }] = useDisclosure(false);

  // Since ExchangesProvider is at the room level, we can directly use useExchanges here
  const { incomingRequests, hasMatch } = useExchanges();

  const exchangeUpdatesCount = useMemo(() => {
    return incomingRequests.filter((req) => req.status === "pending").length;
  }, [incomingRequests]);

  // Get appropriate phase icon
  const PhaseIcon = (() => {
    switch (gamePhase) {
      case "setup":
        return IconHourglass;
      case "speaking":
        return IconMessageCircle;
      case "endgame":
        return IconCards;
      default:
        return IconHourglass;
    }
  })();

  const handlePhaseIconClick = () => {
    onViewChange?.("cards");
  };

  // Handle exchange icon click
  const handleExchangeIconClick = () => {
    onViewChange?.("exchange");
  };

  const currentUserAssignment = currentMember
    ? playerAssignments.get(currentMember.id)
    : undefined;

  return (
    <>
      <Group justify="space-between" h="100%" px="md">
        {/* Left section */}
        <Group gap="xs">
          <Title order={4}>Unspoken</Title>
          <Badge color={gamePhase === "setup" ? "blue" : gamePhase === "speaking" ? "green" : "yellow"}>
            {gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)}
          </Badge>
        </Group>

        {/* Right section */}
        <Group gap="xs">
          {/* Phase indicator - clickable in setup phase when appropriate */}
          <Tooltip label={`Current phase: ${gamePhase}`} position="bottom">
            <ActionIcon
              variant="subtle"
              onClick={handlePhaseIconClick}
              color="blue"
            >
              <PhaseIcon size={20} />
            </ActionIcon>
          </Tooltip>

          {/* Exchange requests with notification badge */}
          <Tooltip label={"Exchange requests"} position="bottom">
            <ActionIcon
              onClick={handleExchangeIconClick}
              variant="subtle"
              color="indigo"
            >
              {hasMatch ? (
                <Indicator
                  label={<IconCheck size={12} />}
                  inline
                  size={16}
                  position="top-end"
                >
                  <IconExchange size={20} />
                </Indicator>
              ) : exchangeUpdatesCount > 0 ? (
                <Indicator
                  label={exchangeUpdatesCount}
                  inline
                  size={16}
                  position="top-end"
                >
                  <IconExchange size={20} />
                </Indicator>
              ) : (
                <IconExchange size={20} />
              )}
            </ActionIcon>
          </Tooltip>

          {/* Join requests for room creator */}
          {isCreator && <JoinRequests roomId={roomId} />}

          {/* Current user avatar */}
          {currentUserAssignment && currentMember && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Box style={{ cursor: 'pointer' }}>
                  <PlayerAvatar
                    assignment={currentUserAssignment}
                    size="md"
                    highlighted={true}
                    highlightColor="green"
                    showTooltip={true}
                    tooltipLabel={`${currentMember.username || "You"}`}
                  />
                </Box>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Profile</Menu.Label>
                <Menu.Item 
                  leftSection={<IconUser size={14} />}
                  onClick={openProfile}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  leftSection={<IconDoorExit size={14} />}
                  color="red" 
                  onClick={handleLeaveRoom}
                >
                  Leave Room
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

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
    </>
  );
}