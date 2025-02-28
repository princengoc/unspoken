// src/components/layout/Header.tsx

import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Group,
  Badge,
  Menu,
  Drawer,
  SegmentedControl,
  Text,
} from "@mantine/core";
import {
  IconDoorExit,
  IconMessageCircle,
  IconCards,
  IconHourglass,
  IconExchange,
  IconUser,
  IconCheck,
} from "@tabler/icons-react";
import { JoinRequests } from "@/hooks/room/JoinRequests";
import { SetupViewType, type GamePhase } from "@/core/game/types";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useExchanges } from "@/context/ExchangesProvider";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { getPlayerAssignments } from "@/components/game/statusBarUtils";
import { ProfileSettings } from "@/app/auth/ProfileSettings";
import { useFullRoom } from "@/context/FullRoomProvider";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import {
  UnspokenGameIcon,
  UnspokenGameIconSmall,
} from "@/core/game/unspokenIcon";

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
  const { isCreator, isSetupComplete } = useFullRoom();
  const playerAssignments = getPlayerAssignments(members, roomId);
  const [profileOpened, { open: openProfile, close: closeProfile }] =
    useDisclosure(false);
  const isSmallScreen = useMediaQuery("(max-width: 400px)");
  const isTinyScreen = useMediaQuery("(max-width: 300px)");

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
  const phaseIcons = {
    setup: <IconHourglass size={isSmallScreen ? 14 : 16} />,
    speaking: <IconMessageCircle size={isSmallScreen ? 14 : 16} />,
    endgame: <IconCards size={isSmallScreen ? 14 : 16} />,
  };

  const currentUserAssignment = currentMember
    ? playerAssignments.get(currentMember.id)
    : undefined;

  // Exchange icon color based on match status
  const exchangeIconColor = hasMatch ? "green" : "gray";

  // Prepare segmented control data based on screen size
  const segmentedControlData = [
    {
      value: "cards",
      label: (
        <Group gap={isSmallScreen ? 4 : 8} wrap="nowrap">
          {phaseIcons[gamePhase]}
          <Text size={isSmallScreen ? "xs" : "sm"} lh={1}>
            {isSmallScreen ? "" : "Say"}
          </Text>
          {isSetupComplete && gamePhase === "setup" && (
            <IconCheck color="green" size={isSmallScreen ? 12 : 14} />
          )}
        </Group>
      ),
    },
    {
      value: "exchange",
      label: (
        <Group gap={isSmallScreen ? 4 : 8} wrap="nowrap">
          <IconExchange
            size={isSmallScreen ? 14 : 16}
            color={exchangeIconColor}
          />
          <Text size={isSmallScreen ? "xs" : "sm"} lh={1}>
            {isSmallScreen ? "" : "Ask"}
          </Text>
          {exchangeUpdatesCount > 0 && (
            <Badge size="xs" color="red" p={2} radius="xl" variant="filled">
              {exchangeUpdatesCount}
            </Badge>
          )}
        </Group>
      ),
    },
  ];

  return (
    <>
      <Group justify="space-between" h="100%" px="md" wrap="nowrap">
        {/* Left section */}
        {
          // (isTinyScreen ? <UnspokenGameIcon /> : <Title order={4} size="h4" lh={1} lineClamp={1}>Unspoken</Title>)
          // <IconMessageCirclePause />
          <Box style={{ position: "relative", display: "inline-block" }}>
            {isTinyScreen ? <UnspokenGameIconSmall /> : <UnspokenGameIcon />}
          </Box>
        }

        {/* Center section - Takes up available space */}
        <Group align="center">
          <SegmentedControl
            value={currentViewState}
            onChange={handleViewChange}
            data={segmentedControlData}
            size={isSmallScreen ? "sm" : "md"}
          />
        </Group>

        {/* Right section */}
        <Group gap="xs" wrap="nowrap">
          {/* Join requests for room creator */}
          {isCreator && <JoinRequests roomId={roomId} />}

          {/* Current user avatar */}
          {currentUserAssignment && currentMember && (
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Box style={{ cursor: "pointer" }}>
                  <PlayerAvatar
                    assignment={currentUserAssignment}
                    size={isSmallScreen ? "xs" : "sm"}
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
