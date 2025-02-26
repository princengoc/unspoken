// Provide coordinate across all context providers
// and turn them into convenient game logic functions for components
// We use this when we have joined a room already
// Components that deal with joining/creation of rooms use the useRoomAPI hook.
import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import { useRoom } from "./RoomProvider";
import { RoomMembersProvider, useRoomMembers } from "./RoomMembersProvider";
import { CardsInGameProvider, useCardsInGame } from "./CardsInGameProvider";
import { ExchangesProvider } from "./ExchangesProvider";
import type {
  Card,
  CardState,
  Room,
  RoomSettings,
  DerivedPlayerStatus,
  Player,
} from "@/core/game/types";
import { AudioMessagesProvider } from "./AudioMessagesProvider";

interface FullRoomContextType {
  initiateSpeakingPhase: () => Promise<void>;
  finishSpeaking: () => Promise<void>;
  handleCardSelection: (cardId: string) => Promise<void>;
  dealCards: (playerId: string) => Promise<Card[]>; // renamed to handleDealCards
  startNextRound: (settings: Partial<RoomSettings>) => Promise<void>;

  // states
  isCreator: boolean;
  isSetupComplete: boolean;
  isActiveSpeaker: boolean;
  currentMemberStatus: DerivedPlayerStatus;
}

const FullRoomContext = createContext<FullRoomContextType | null>(null);

interface FullRoomProviderProps {
  roomId: string;
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

function FullRoomProviderInner({ children }: { children: ReactNode }) {
  const {
    room,
    finishSpeaking: roomFinishSpeaking,
    startNextRound: roomStartNextRound,
    startSpeakingPhase,
  } = useRoom();

  const { members, currentMember } = useRoomMembers();

  const { cardState, dealCardsToPlayer, completePlayerSetup } =
    useCardsInGame();

  // Destructure currentMember values for easier dependency management
  const currentMemberId = currentMember?.id;
  const isCreator = currentMemberId === room!.created_by;
  const hasSpoken = currentMember?.has_spoken ?? false;
  const isActiveSpeaker =
    currentMemberId === room!.active_player_id && !hasSpoken;

  // Destructure room to keep react hooks and lint happy
  const roomPhase = room!.phase;

  const currentMemberStatus = useMemo(
    () => derivePlayerStatus(currentMember?.id, cardState, room!),
    [currentMember?.id, cardState, room],
  );

  const isSetupComplete = useMemo(() => {
    // For remote mode, check if all members have spoken
    if (room?.game_mode === "remote") {
      return members.every((member) => member.has_spoken);
    }
    // For normal mode, keep the existing logic
    return allMembersHaveSelectedCards(members, cardState.selectedCards);
  }, [members, cardState.selectedCards, room?.game_mode]);

  const completeSetup = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || roomPhase !== "setup") return;
      try {
        await completePlayerSetup(currentMemberId, cardId);
      } catch (error) {
        console.error("Failed to complete setup:", error);
        throw error;
      }
    },
    [currentMemberId, roomPhase, completePlayerSetup],
  );

  const initiateSpeakingPhase = useCallback(async () => {
    if (!isCreator) {
      console.warn("Only the room creator can start the speaking phase.");
      return;
    }
    try {
      const isRemote = room?.game_mode === "remote";
      await startSpeakingPhase(currentMemberId, isRemote);
    } catch (error) {
      console.error("Failed to initiate speaking phase:", error);
      throw error;
    }
  }, [currentMemberId, isCreator, startSpeakingPhase, room?.game_mode]);

  const finishSpeaking = useCallback(async () => {
    if (!currentMemberId) {
      console.log(`Invalid finishSpeaking call: member ID ${currentMemberId}`);
      return;
    }

    try {
      if (room?.game_mode === "remote") {
        // In remote mode, this is called by the creator to end the reviewing phase
        // Skip active speaker check and go directly to endgame
        await roomFinishSpeaking(currentMemberId, true); // Pass isRemote flag
      } else if (isActiveSpeaker) {
        // Normal IRL mode - requires active speaker check
        await roomFinishSpeaking(currentMemberId);
      } else {
        console.log(`User ${currentMemberId} is not the active speaker`);
      }
    } catch (error) {
      console.error("Failed to finish speaking:", error);
      throw error;
    }
  }, [currentMemberId, isActiveSpeaker, roomFinishSpeaking, room?.game_mode]);

  const handleCardSelection = useCallback(
    async (cardId: string) => {
      if (!currentMemberId || roomPhase !== "setup") return;
      await completeSetup(cardId);
    },
    [currentMemberId, roomPhase, completeSetup],
  );

  // Update the handleDealCards function to use new dealCardsToPlayer
  const handleDealCards = useCallback(async () => {
    try {
      const dealtCards = await dealCardsToPlayer(currentMemberId!);
      return dealtCards;
    } catch (error) {
      console.error("Failed to deal cards:", error);
      throw error;
    }
  }, [dealCardsToPlayer, currentMemberId]);

  // Generalized method to start next round (regular or encore)
  const startNextRound = useCallback(
    async (settings: Partial<RoomSettings>): Promise<void> => {
      if (!currentMemberId || !isCreator) {
        console.warn("Only the room creator can start the next round.");
        return;
      }

      try {
        await roomStartNextRound(currentMemberId, settings);
      } catch (error) {
        console.error("Failed to start next round:", error);
        throw error;
      }
    },
    [currentMemberId, isCreator, roomStartNextRound],
  );

  const value = {
    initiateSpeakingPhase,
    finishSpeaking,
    handleCardSelection,
    dealCards: handleDealCards,
    startNextRound,
    isCreator,
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

export function FullRoomProvider({ roomId, children }: FullRoomProviderProps) {
  // get the room from RoomProvider and then subsequent contexts can just refer to the room state via useRoom()
  return (
    <CardsInGameProvider roomId={roomId}>
      <RoomMembersProvider roomId={roomId}>
        <ExchangesProvider roomId={roomId}>
          <AudioMessagesProvider roomId={roomId}>
            <FullRoomProviderInner>{children}</FullRoomProviderInner>
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
