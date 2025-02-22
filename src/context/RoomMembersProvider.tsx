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
  updateMember: (memberId: string, updates: Partial<Player>) => Promise<void>;
  resetAllPlayers: () => Promise<void>;
  updateAllExcept: (exceptPlayerId: string, allStatus: PlayerStatus, exceptStatus: PlayerStatus) => Promise<void>;
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
        console.error(`Failed to fetch room members: ${JSON.stringify(error)}`);
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
  const updateMember = async (memberId: string, updates: Partial<Player>) => {
    try {
      // optimistic update
      setMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, updates } : m)
      );
      await roomMembersService.updatePlayerState(roomId, memberId, updates);
    } catch (error) {
      console.error('Failed to update member:', error);
      throw error;
    }
  };

  // reset to start new round
  const resetAllPlayers = async () => {
    try { 
      // optimistic update
      setMembers(prev => 
        prev.map(m => ({
          ...m,
          hasSpoken: false,
          status: PLAYER_STATUS.CHOOSING
        }))
      );            
      await roomMembersService.resetAllPlayers(roomId);       
    } catch (error) {
      console.error('Failed to reset player status:', error);
      throw error;
    }
  }

 const updateAllExcept = async (exceptPlayerId: string, allStatus: PlayerStatus, exceptStatus: PlayerStatus) => {
  try { 
    // optimistic update
    setMembers(prev => 
      prev.map(m => ({
        ...m,
        hasSpoken: false,
        status: PLAYER_STATUS.CHOOSING
        }))
      );
    await roomMembersService.updateAllPlayerStatusExceptOne(roomId, exceptPlayerId, allStatus, exceptStatus)    
    } catch (error) {
      console.error('Failed to update all except:', error);
      throw error;
    }
 }

  const value = {
    // State
    members,
    currentMember,
    
    // Status checks
    isAllMembersReady,
    isCurrentMemberReady,
    
    // Actions
    updateMember,
    resetAllPlayers, 
    updateAllExcept
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