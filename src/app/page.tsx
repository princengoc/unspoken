"use client";

import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";

import NewSplashScreen from "@/components/layout/NewSplashScreen";
import LobbyView from "@/components/layout/LobbyView";

// Importing hooks and services
import { useRoomState } from "@/hooks/room/useRoomState";
import { useScrollPosition } from "@/hooks/room/useScrollPosition";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { height } = useViewportSize();

  // Add a state to explicitly control which view is shown
  const [showLobbyView, setShowLobbyView] = useState(false);

  // Handle splash screen visibility based on scroll OR direct toggle
  const { scrollY } = useScrollPosition();
  const showLobby = showLobbyView || scrollY > height * 0.5;

  // Room state from custom hook
  const {
    rooms,
    loadedRoomMembers,
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
  } = useRoomState();

  // Load rooms when lobby becomes visible
  useEffect(() => {
    if (showLobby && user) {
      loadActiveRooms();
    }
  }, [showLobby, user, loadActiveRooms]);

  const onLogout = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <Container fluid p={0} style={{ height: "100vh", overflow: "auto" }}>
      {/* Splash Screen */}
      <NewSplashScreen
        visible={!showLobby}
        user={user}
        onLogin={() => router.push("/auth")}
        onEnterLobby={() => setShowLobbyView(true)}
      />

      {/* Lobby View */}
      <LobbyView
        visible={showLobby}
        user={user}
        loading={loading}
        rooms={rooms}
        loadedRoomMembers={loadedRoomMembers}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        newRoomName={newRoomName}
        setNewRoomName={setNewRoomName}
        cardDepthFilter={cardDepthFilter}
        setCardDepthFilter={setCardDepthFilter}
        isAddingRoom={isAddingRoom}
        setIsAddingRoom={setIsAddingRoom}
        isJoiningRoom={isJoiningRoom}
        setIsJoiningRoom={setIsJoiningRoom}
        isRemote={isRemote}
        setIsRemote={setIsRemote}
        loadActiveRooms={loadActiveRooms}
        handleCreateRoom={handleCreateRoom}
        handleJoinRoom={handleJoinRoom}
        goToRoom={goToRoom}
        roomAPILoading={roomAPILoading}
        onLogin={() => router.push("/auth")}
        onLogout={onLogout}
      />
    </Container>
  );
}
