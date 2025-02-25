// src/components/layout/SideNavbar.tsx

import React, { useState, useMemo } from "react";
import {
  Stack,
  ActionIcon,
  Tooltip,
  Indicator,
  Divider,
  Modal,
  Text,
} from "@mantine/core";
import {
  IconDoorExit,
  IconHourglass,
  IconRipple,
  IconMessageCircle,
  IconCards,
  IconCheck,
  IconHelp,
  IconExchange,
  IconCirclesRelation,
  IconIkosaedr,
  IconCell,
} from "@tabler/icons-react";
import { JoinRequests } from "@/hooks/room/JoinRequests";
import { SetupViewType, type GamePhase } from "@/core/game/types";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useExchanges } from "@/context/ExchangesProvider";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { getPlayerAssignments } from "@/components/game/statusBarUtils";
import { ProfileSettings } from "@/app/auth/ProfileSettings";
import { useFullRoom } from "@/context/FullRoomProvider";

interface SideNavbarProps {
  roomId: string;
  gamePhase: GamePhase;
  handleLeaveRoom?: () => void;
  onViewChange?: (view: SetupViewType) => void;
}

export function SideNavbar({
  roomId,
  gamePhase,
  handleLeaveRoom,
  onViewChange,
}: SideNavbarProps) {
  const { members, currentMember } = useRoomMembers();
  const { isCreator, currentMemberStatus } = useFullRoom();
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const playerAssignments = getPlayerAssignments(members, roomId);

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

  // Get help text based on current phase
  const getHelpText = () => {
    switch (currentMemberStatus) {
      case "drawing":
      case "choosing":
        return (
          <>
            Choose a card that sparks a story you want to share. There is no
            right or wrong, only what feels true.
          </>
        );
      case "browsing":
        return (
          <>
            While others choose their cards, explore the exchange board. Here
            you can make small invitations in the <strong>Encore</strong> round—
            <em>"If you share your story, I will share mine"</em>—that can spark
            deeper connections. The game begins when everyone is ready.
          </>
        );
      case "speaking":
        return (
          <>
            Share the story your card evokes. Click{" "}
            <strong>Start Sharing</strong> to begin, and{" "}
            <strong>Finish Sharing</strong> when your story feels complete.
          </>
        );
      case "listening":
        return (
          <>
            Someone is sharing. If their words resonate, send a private
            emoji—like a heart or spark—to show how you feel. Or send a{" "}
            <IconRipple size={14} /> <strong>Ripple</strong> to say,{" "}
            <em>
              "You have inspired me to share my story on this card later."
            </em>
          </>
        );
      case "done":
      default:
        return (
          <>
            As the game winds down, it's time for <strong>Encore</strong>—a
            chance to share the stories sparked along the way. Use cards
            received through exchanges or respond to a <IconRipple size={14} />{" "}
            <strong>Ripple</strong> that moved you. There’s no pressure—only an
            invitation to continue the conversation if it feels right.
          </>
        );
    }
  };

  // can view exchange only at browsing
  const canViewExchange = currentMemberStatus === "browsing";

  const handlePhaseIconClick = () => {
    onViewChange?.("cards");
  };

  // Handle exchange icon click
  const handleExchangeIconClick = () => {
    if (canViewExchange) {
      onViewChange?.("exchange");
    }
  };

  const handleAvatarClick = () => {
    setProfileModalOpen(true);
  };

  const currentUserAssignment = currentMember
    ? playerAssignments.get(currentMember.id)
    : undefined;

  return (
    <>
      <Stack
        justify="space-between"
        h="100%"
        p="md"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "80px",
          background: "white",
          borderRight: "1px solid #eee",
        }}
      >
        {/* Top section */}
        <Stack gap="lg" align="center">
          {/* Current user avatar */}
          {currentUserAssignment && currentMember && (
            <PlayerAvatar
              assignment={currentUserAssignment}
              size="lg"
              highlighted={true}
              highlightColor="green"
              showTooltip={true}
              tooltipLabel={`${currentMember.username || "You"}`}
              onClick={handleAvatarClick}
            />
          )}

          <Divider style={{ width: "100%" }} />

          {/* Phase indicator - clickable in setup phase when appropriate */}
          <Tooltip label={`Current phase: ${gamePhase}`} position="right">
            <ActionIcon
              variant="subtle"
              size="xl"
              onClick={handlePhaseIconClick}
            >
              <PhaseIcon size={24} />
            </ActionIcon>
          </Tooltip>

          {/* Exchange requests with notification badge */}
          <Tooltip
            label={
              canViewExchange ? "Exchange requests" : "Exchange not available"
            }
            position="right"
          >
            <ActionIcon
              onClick={handleExchangeIconClick}
              variant="subtle"
              size="lg"
              disabled={!canViewExchange}
              color={!canViewExchange ? "gray" : undefined}
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
              ) : exchangeUpdatesCount > 0 && canViewExchange ? (
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

          {/* Help button */}
          <Tooltip label="Game help" position="right">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => setHelpModalOpen(true)}
            >
              <IconHelp size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>

        {/* Bottom section */}
        <Stack gap="md" align="center">
          <Divider style={{ width: "100%" }} />

          <Tooltip label="Leave Room" position="right">
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              onClick={handleLeaveRoom}
            >
              <IconDoorExit size={20} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Help Modal */}
      <Modal
        opened={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title={`${gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1)} Phase - ${currentMemberStatus.charAt(0).toUpperCase() + currentMemberStatus.slice(1)}`}
      >
        <Text c="dimmed">{getHelpText()}</Text>
      </Modal>

      {/* Profile Modal */}
      <Modal
        opened={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profile Settings"
        size="md"
      >
        <ProfileSettings />
      </Modal>
    </>
  );
}
