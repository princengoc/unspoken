import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { roomMembersService } from '@/services/supabase/roomMembers';
import type { Card, Player, PlayerStatus } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';

// Define context type
interface RoomMembersContextType {
  // State
  members: Player[];
  currentMember: Player | null;
  
  // Status checks
  isAllMembersReady: boolean;
  isCurrentMemberReady: boolean;
  
  // Actions
  updateMemberStatus: (memberId: string, status: PlayerStatus) => Promise<void>;
  updateMemberCard: (memberId: string, cardId: string | null) => Promise<void>;
  updateMemberHand: (memberId: string, cards: Card[]) => Promise<void>;
  markMemberAsSpoken: (memberId: string, hasSpoken: boolean) => Promise<void>;
}

const RoomMembersContext = createContext<RoomMembersContextType | null>(null);

interface RoomMembersProviderProps {
  roomId: string;
  children: ReactNode;
}

export function RoomMembersProvider({ roomId, children }: RoomMembersProviderProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Player[]>([]);
  
  // Set up real-time sync
  useEffect(() => {
    // Initial fetch
    const fetchMembers = async () => {
      try {
        const initialMembers = await roomMembersService.getRoomMembers(roomId);
        setMembers(initialMembers);
      } catch (error) {
        console.error('Failed to fetch room members:', error);
      }
    };
    fetchMembers();

    // Subscribe to changes
    const subscription = roomMembersService.subscribeToRoomMembers(
      roomId,
      (updatedMembers) => {
        setMembers(updatedMembers);
      }
    );

    // Cleanup
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, [roomId]);

  // Keep track of current member
  const currentMember = members.find(m => m.id === user?.id) || null;

  // Derived states
  const isAllMembersReady = members.every(
    member => member.status === PLAYER_STATUS.BROWSING
  );
  
  const isCurrentMemberReady = currentMember?.status === PLAYER_STATUS.BROWSING;

  // Member state update actions
  const updateMemberStatus = async (memberId: string, status: PlayerStatus) => {
    try {
      await roomMembersService.updatePlayerState(roomId, memberId, { status });
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, status } : m)
      );
    } catch (error) {
      console.error('Failed to update member status:', error);
      throw error;
    }
  };

  const updateMemberCard = async (memberId: string, cardId: string | null) => {
    try {
      await roomMembersService.updatePlayerState(roomId, memberId, { 
        selectedCard: cardId 
      });
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, selectedCard: cardId } : m)
      );
    } catch (error) {
      console.error('Failed to update member card:', error);
      throw error;
    }
  };

  const updateMemberHand = async (memberId: string, cards: Card[]) => {
    try {
      await roomMembersService.updatePlayerHand(roomId, memberId, cards);
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, playerHand: cards } : m)
      );
    } catch (error) {
      console.error('Failed to update member hand:', error);
      throw error;
    }
  };

  const markMemberAsSpoken = async (memberId: string, hasSpoken: boolean) => {
    try {
      await roomMembersService.updatePlayerState(roomId, memberId, { hasSpoken });
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, hasSpoken } : m)
      );
    } catch (error) {
      console.error('Failed to mark member as spoken:', error);
      throw error;
    }
  };

  const value = {
    // State
    members,
    currentMember,
    
    // Status checks
    isAllMembersReady,
    isCurrentMemberReady,
    
    // Actions
    updateMemberStatus,
    updateMemberCard,
    updateMemberHand,
    markMemberAsSpoken,
  };

  return (
    <RoomMembersContext.Provider value={value}>
      {children}
    </RoomMembersContext.Provider>
  );
}

// Hook for using room members context
export function useRoomMembers() {
  const context = useContext(RoomMembersContext);
  if (!context) {
    throw new Error('useRoomMembers must be used within RoomMembersProvider');
  }
  return context;
}