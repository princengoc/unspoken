// src/components/layout/Header.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Group,
  ActionIcon,
  Indicator,
  Badge,
  Menu,
  Drawer,
  Title,
  SegmentedControl,
  Text,
} from "@mantine/core";
import {
  IconDoorExit,
  IconMessageCircle,
  IconCards,
  IconHourglass,
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
  currentView?: SetupViewType;
}

export function Header({
  roomId,
  gamePhase,
  handleLeaveRoom,
  onViewChange,
  currentView = "cards",
}: HeaderProps) {
  const { members, currentMember } = useRoomMembers();
  const { isCreator } = useFullRoom();
  const playerAssignments = getPlayerAssignments(members, roomId);
  const [profileOpened, { open: openProfile, close: closeProfile }] = useDisclosure(false);
  
  // Local state to track view
  const [currentViewState, setCurrentViewState] = useState(currentView);
  
  // Update local state when prop changes
  useEffect(() => {
    setCurrentViewState(currentView);
  }, [currentView]);

  // Since ExchangesProvider is at the room level, we can directly use useExchanges here
  const { incomingRequests, hasMatch } = useExchanges();

  const exchangeUpdatesCount = useMemo(() => {
    return incomingRequests.filter((req) => req.status === "pending").length;
  }, [incomingRequests]);

  // Handle view change
  const handleViewChange = (value: string) => {
    const newView = value as SetupViewType;
    setCurrentViewState(newView); // Update local state immediately for UI feedback
    onViewChange?.(newView);
  };

  // Get phase display info
  const phaseColors = {
    setup: "blue",
    speaking: "green",
    endgame: "yellow",
  };

  const phaseLabels = {
    setup: "Setup",
    speaking: "Discussion",
    endgame: "Game End",
  };

  const phaseIcons = {
    setup: <IconHourglass />,
    speaking: <IconMessageCircle />,
    endgame: <IconCards />
  };

  const currentUserAssignment = currentMember
    ? playerAssignments.get(currentMember.id)
    : undefined;

  return (
    <>
      <Group justify="space-between" h="100%" px="md">
        {/* Left section */}
        <Group gap="xs">
          <Title order={4} size="h4" lineClamp={1}>Unspoken</Title>
        </Group>

        {/* Center section - View toggle */}
          <SegmentedControl
            value={currentViewState}
            onChange={handleViewChange}
            data={[
              {
                value: 'cards',
                label: (
                //     <Badge color={phaseColors[gamePhase]} leftSection={phaseIcons[gamePhase]}>
                //     {phaseLabels[gamePhase]}
                //   </Badge>                    
                  <Group gap={8}>
                    {phaseIcons[gamePhase]}
                    <Text>{phaseLabels[gamePhase]}</Text>
                  </Group>
                ),
              },
              {
                value: 'exchange',
                label: (
                  <Group gap={8}>
                    <IconExchange size={16} />
                    <Text>Trade Cards</Text>
                    {exchangeUpdatesCount > 0 && (
                      <Badge size="xs" color="red" p={4} radius="xl" variant="filled">
                        {exchangeUpdatesCount}
                      </Badge>
                    )}
                    {hasMatch && <Badge color="green" size="xs">Match Found!</Badge>}
                  </Group>
                ),
              },
            ]}
            // fullWidth
            size="sm"
          />

        {/* Right section */}
        <Group gap="xs">
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
                    showTooltip={false}
                  />
                </Box>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{currentMember.username || "You"}</Menu.Label>
                <Menu.Item 
                  leftSection={<IconUser size={14} />}
                  onClick={openProfile}
                >
                  Profile Settings
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