// src/app/room/[id]/page.tsx

"use client";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Text, Loader, AppShell } from "@mantine/core";
import { FullRoomProvider } from "@/context/FullRoomProvider";
import { RoomProvider, useRoom } from "@/context/RoomProvider";
import { Setup } from "@/components/game/GamePhases/Setup";
import { Speaking } from "@/components/game/GamePhases/Speaking";
import { Header } from "@/components/layout/Header";
import { notifications } from "@mantine/notifications";
import { Endgame } from "@/components/game/GamePhases/Endgame";
import { SetupViewType, Room } from "@/core/game/types";
import { ExchangeTab } from "@/components/game/ExchangeRequests/ExchangeTab";
import { SpeakingRemote } from "@/components/game/GamePhases/SpeakingRemote";

function renderGameContent(currentSetupView: SetupViewType, room: Room) {
  // always allow view of exchange tab
  if (currentSetupView === "exchange") {
    return <ExchangeTab roomId={room.id} />;
  }

  // otherwise depends on the game phase
  if (room.phase === "setup") {
    return <Setup />;
  } else if (room.phase === "endgame") {
    return <Endgame roomId={room.id} />;
  } else {
    if (room.game_mode === "remote") {
      return <SpeakingRemote roomId={room.id} />;
    }
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
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader size="xl" />
        <Text ml="md">Loading room...</Text>
      </Box>
    );
  }

  // Only render the full app shell once we have room data
  return (
    <FullRoomProvider roomId={roomId}>
      <AppShell header={{ height: 60 }}>
        <AppShell.Header>
          <Header
            roomId={room.id}
            gamePhase={room.phase}
            handleLeaveRoom={handleLeaveRoom}
            onViewChange={handleViewChange}
          />
        </AppShell.Header>

        <AppShell.Main pt={70} px="md">
          {renderGameContent(currentSetupView, room)}
        </AppShell.Main>
      </AppShell>
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
