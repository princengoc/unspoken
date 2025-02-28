// Provide coordinate across all context providers
// and turn them into convenient game logic functions for components
// We use this when we have joined a room already
// Components that deal with joining/creation of rooms use the useRoomAPI hook.
import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useRoom } from "./RoomProvider";
import { RoomMembersProvider, useRoomMembers } from "./RoomMembersProvider";
import { CardsInGameProvider, useCardsInGame } from "./CardsInGameProvider";
import { ExchangesProvider } from "./ExchangesProvider";
import type {
  CardState,
  Room,
  DerivedPlayerStatus,
  Player,
} from "@/core/game/types";
import { AudioMessagesProvider } from "./AudioMessagesProvider";

interface FullRoomContextType {
  // states
  isSetupComplete: boolean;
  isActiveSpeaker: boolean;
  currentMemberStatus: DerivedPlayerStatus;
}

const FullRoomContext = createContext<FullRoomContextType | null>(null);

interface FullRoomProviderProps {
  roomId: string;
  userId: string;
  children: ReactNode;
}

// utility function to figure out what stage a player is in
function derivePlayerStatus(
  playerId: string | undefined,
  cardState: CardState,
  room: Room,
): DerivedPlayerStatus {
  if (!playerId) return "done";

  // In speaking phase
  if (room.phase === "speaking") {
    if (playerId === room.active_player_id) return "speaking";
    return "listening";
  }

  if (room.phase === "endgame") {
    return "done";
  }

  // In setup phase
  const playerHand = cardState.playerHands[playerId];
  const hasSelectedCard = cardState.selectedCards[playerId];

  if (hasSelectedCard) {
    return "browsing";
  } else {
    return !playerHand?.length ? "drawing" : "choosing";
  }
}

function allMembersHaveSelectedCards(
  members: Player[],
  selectedCards: Record<string, string>,
): boolean {
  return members.every(
    (member) => member.id in selectedCards && selectedCards[member.id] !== null,
  );
}

function FullRoomProviderInner({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { room } = useRoom();

  const { members, currentMember } = useRoomMembers();

  const { cardState } = useCardsInGame();

  // Destructure currentMember values for easier dependency management
  const hasSpoken = currentMember?.has_spoken ?? false;
  const isActiveSpeaker = userId === room!.active_player_id && !hasSpoken;
  const isRemote = room?.game_mode === "remote";

  const currentMemberStatus = useMemo(
    () => derivePlayerStatus(userId, cardState, room!),
    [cardState, room],
  );

  const isSetupComplete = useMemo(() => {
    // For remote mode, check if all members have spoken
    if (isRemote) {
      return members.every((member) => member.has_spoken);
    }
    // For normal mode, keep the existing logic
    return allMembersHaveSelectedCards(members, cardState.selectedCards);
  }, [members, cardState.selectedCards, isRemote]);

  const value = {
    isSetupComplete,
    isActiveSpeaker,
    currentMemberStatus,
  };

  return (
    <FullRoomContext.Provider value={value}>
      {children}
    </FullRoomContext.Provider>
  );
}

export function FullRoomProvider({
  roomId,
  userId,
  children,
}: FullRoomProviderProps) {
  // get the room from RoomProvider and then subsequent contexts can just refer to the room state via useRoom()
  return (
    <CardsInGameProvider roomId={roomId} userId={userId}>
      <RoomMembersProvider roomId={roomId}>
        <ExchangesProvider roomId={roomId}>
          <AudioMessagesProvider roomId={roomId}>
            <FullRoomProviderInner userId={userId}>
              {children}
            </FullRoomProviderInner>
          </AudioMessagesProvider>
        </ExchangesProvider>
      </RoomMembersProvider>
    </CardsInGameProvider>
  );
}

export function useFullRoom() {
  const context = useContext(FullRoomContext);
  if (!context) {
    throw new Error("useFullRoom must be used within FullRoomProvider");
  }
  return context;
}
