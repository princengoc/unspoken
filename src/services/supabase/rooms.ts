import { supabase } from './client';
import { type Room, type RoomSettings, GamePhase } from '@/core/game/types';
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
      phase: 'setup' as GamePhase, 
      active_player_id: null,
      card_depth: settings?.card_depth ?? null, 
      deal_extras: settings?.deal_extras ?? null
    };

    // after insertion room now has id, needs to be returned
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
    
    if (error) throw error;

    // Add creator to room_members
    await roomMembersService.addNewMember(room.id, createdBy);

    return room as Room;
  },

  async join(roomId: string, playerId: string): Promise<Room> {

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
        is_online: true,
      })
    } else {
      // Add new member
      await roomMembersService.addNewMember(roomId, playerId);
    }
    
    return room as Room;
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

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', roomId);
  
    if (error) throw error;
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

  /* Game specific phase changes */

  async finishSpeaking(
    roomId: string,
    speakerId: string
  ): Promise<{ next_phase: GamePhase; next_speaker_id: string | null }> {
    const { data, error } = await supabase.rpc('finish_speaking', {
      p_room_id: roomId,
      p_current_speaker_id: speakerId
    });
  
    if (error) throw error;
  
    return {
      next_phase: data[0].next_phase as GamePhase,
      next_speaker_id: data[0].next_speaker_id || null
    };
  },  

  // called by room creator to start speaking phase, picks a random speaker and do all state transitions
  async startSpeakingPhase(
    roomId: string,
    creatorId: string
  ): Promise<{ next_phase: GamePhase; first_speaker_id: string | null }> {
    const { data, error } = await supabase.rpc('start_speaking_phase', {
      p_room_id: roomId,
      p_creator_id: creatorId
    });

    if (error) throw error;

    return {
      next_phase: data[0].next_phase as GamePhase,
      first_speaker_id: data[0].first_speaker_id || null
    };
  },

  async startNextRound(
    roomId: string, 
    creatorId: string,
    settings: Partial<RoomSettings>
  ): Promise<string> {
    const { data, error } = await supabase.rpc('start_next_round', {
      p_room_id: roomId,
      p_creator_id: creatorId,
      p_deal_extras: settings.deal_extras ?? true,
      p_card_depth: settings.card_depth
    });
  
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