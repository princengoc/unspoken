import { supabase } from './client';
import type { Room, Player, RoomSettings } from '@/core/game/types';
import { PLAYER_STATUS } from '@/core/game/constants';
import { roomMembersService } from './roomMembers';

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
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
    
    if (error) throw error;

    // Add creator to room_members
    await roomMembersService.updatePlayerState(data.id, createdBy, {
      status: 'choosing',
      hasSpoken: false,
      is_online: true,
      playerHand: []
    });

    return data as Room;
  },

  async join(roomId: string, player: Player): Promise<Room> {
    const { data: dataRoom, error: findError } = await supabase
      .from('rooms')
      .select()
      .eq('id', roomId)
      .eq('is_active', true)
      .single();
    
    if (findError) throw findError;
    if (!dataRoom) throw new Error('Room not found');

    const room = dataRoom as Room;

    // Check if player already exists in the room
    const existingPlayer = room.players.find(p => p.id === player.id);
    
    if (existingPlayer) {
      // Update existing player's status
      const updatedPlayer = {
        ...existingPlayer,
        isOnline: true
      };

      const { data, error } = await supabase.rpc(
        'update_player_status',
        {
          room_id: roomId,
          player_id: player.id,
          new_status: updatedPlayer
        }
      );

      if (error) throw error;
      return data as Room;
    }

    // Add new player with initial state
    const newPlayer = {
      ...player,
      status: PLAYER_STATUS.CHOOSING,
      hasSpoken: false
    };

    const { data, error } = await supabase
      .from('rooms')
      .update({ 
        players: [...room.players, newPlayer] 
      })
      .eq('id', room.id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Room;
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