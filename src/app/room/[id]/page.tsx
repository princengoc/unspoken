// src/app/room/[id]/page.tsx

"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, Text, Loader } from "@mantine/core";
import { FullRoomProvider } from "@/context/FullRoomProvider";
import { RoomProvider, useRoom } from "@/context/RoomProvider";
import { Setup } from "@/components/game/GamePhases/Setup";
import { Speaking } from "@/components/game/GamePhases/Speaking";
import { SideNavbar } from "@/components/layout/SideNavbar";
import { notifications } from "@mantine/notifications";
import { Endgame } from "@/components/game/GamePhases/Endgame";
import { SetupViewType, Room } from "@/core/game/types";
import { ExchangeTab } from "@/components/game/ExchangeRequests/ExchangeTab";

function renderGameContent(currentSetupView: SetupViewType, room: Room) {
  // always allow view of exchange tab
  if (currentSetupView === "exchange") {
    return <ExchangeTab />;
  }

  // otherwise depends on the game phase
  if (room.phase === "setup") {
    return <Setup />;
  } else if (room.phase === "endgame") {
    return <Endgame roomId={room.id} />;
  } else {
    return <Speaking roomId={room.id} />;
  }
}

/**
 * Main content component that renders the actual room UI
 */
function RoomContent({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { room, loading, error, leaveRoom } = useRoom();
  const [currentSetupView, setCurrentSetupView] =
    useState<SetupViewType>("cards");

  // Handle leaving room
  const handleLeaveRoom = async () => {
    await leaveRoom();
    router.push("/");
  };

  // Memoized callback to prevent unnecessary renders
  const handleViewChange = useCallback((view: SetupViewType) => {
    setCurrentSetupView(view);
  }, []);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: "Error",
        message: error.message,
        color: "red",
      });
      router.push("/");
    }
  }, [error, router]);

  if (loading || !room) {
    return (
      <Container py="xl">
        <Box ta="center">
          <Loader size="xl" />
          <Text mt="md">Loading room...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <FullRoomProvider roomId={roomId}>
      <Box style={{ height: "100vh", position: "relative" }}>
        {/* Side Navigation */}
        <SideNavbar
          roomId={room.id}
          gamePhase={room.phase}
          handleLeaveRoom={handleLeaveRoom}
          onViewChange={handleViewChange}
        />

        {/* Main Content */}
        <Box
          style={{
            marginLeft: "80px",
            padding: "1rem",
            height: "100%",
            overflowY: "auto",
          }}
        >
          {renderGameContent(currentSetupView, room)}
        </Box>

      </Box>
    </FullRoomProvider>
  );
}




/**
 * Main page component that handles params and sets up providers
 */
interface RoomPageProps {
  params: Promise<{ id: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { id: roomId } = use(params);

  return (
    <RoomProvider roomId={roomId}>
      <RoomContent roomId={roomId} />
    </RoomProvider>
  );
}
