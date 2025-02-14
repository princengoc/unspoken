import { supabase } from './client';
import { type Room, type RoomSettings, DEFAULT_PLAYER, GamePhase } from '@/core/game/types';
import { roomMembersService } from './roomMembers';
import { gameStatesService } from './gameStates';

export const roomsService = {
  async create(name: string, createdBy: string, settings?: Partial<RoomSettings>): Promise<Room> {
    const passcode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const roomData = {
      name,
      created_by: createdBy,
      passcode,
      game_mode: 'irl',
      is_active: true,
      settings: {
        allow_card_exchanges: true,
        allow_ripple_effects: true,
        rounds_per_player: 3,
        card_selection_time: 30,
        base_sharing_time: 120,
        ...settings
      }
    };
    
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
    
    if (error) throw error;

    // Create initial game state
    const initialState = {
      room_id: room.id,
      phase: 'setup' as GamePhase,
      activePlayerId: null,
      cardsInPlay: [],
      discardPile: [],
      currentRound: 1,
      totalRounds: 3
    };
    
    await gameStatesService.create(initialState);

    // Add creator to room_members
    await roomMembersService.addNewMember(room.id, createdBy);
    await roomMembersService.updatePlayerState(room.id, createdBy, DEFAULT_PLAYER);

    // Fetch the updated room with game_state_id
    const { data: updatedRoom, error: fetchError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', room.id)
      .single();
      
    if (fetchError) throw fetchError;
    if (!updatedRoom) throw new Error('Failed to fetch updated room');

    return updatedRoom as Room;
  },

  async join(roomId: string, playerId: string): Promise<Room> {
    // First check if room exists and is active
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .eq('is_active', true)
      .single();
    
    if (findError) throw findError;
    if (!room) throw new Error('Room not found');

    // Check if player already exists in room_members
    const memberExists = await roomMembersService.hasRoomMember(roomId, playerId); 
    
    if (memberExists) {
      // Update existing member's status
      await roomMembersService.updatePlayerState(roomId, playerId, { 
        isOnline: true,
      })
    } else {
      // Add new member
      await roomMembersService.addNewMember(roomId, playerId);
    }
    
    return room;
  },

  async get(roomId: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Room not found');

    return data as Room;
  },

  async updateSettings(roomId: string, settings: Partial<RoomSettings>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update({ settings })
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Room;
  },

  async findPasscodeByRoom(roomId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('passcode') // Select only the 'passcode' field
      .eq('id', roomId)
      .eq('is_active', true)
      .single();
  
    if (error && error.code === 'PGRST116') return null; // Room not found
    if (error) throw error;

    const passcode = data?.passcode as string | undefined; 

    return passcode? passcode.toUpperCase() : null;
  },

  async findRoomByPasscode(passcode: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('passcode', passcode.toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (error && error.code === 'PGRST116') return null; // Room not found
    if (error) throw error;
    return data;
  },  

  subscribeToRoom(roomId: string, callback: (room: Room) => void) {
    return supabase
      .channel(`rooms:${roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms',
          filter: `id=eq.${roomId}`
        }, 
        (payload) => callback(payload.new as Room)
      )
      .subscribe();
  }
};