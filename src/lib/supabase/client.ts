import { createClient } from '@supabase/supabase-js';
import type { Card, GameSession, Exchange } from './types';
import type { Room, RoomPlayer, RoomSettings } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for game sessions
export const sessionsTable = {
  async create(initialData: Partial<GameSession>) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([initialData])
      .select()
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  async get(sessionId: string) {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },

  async update(sessionId: string, updates: Partial<GameSession>) {
    const { data, error } = await supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data as GameSession;
  },  

  async addPlayer(sessionId: string, userId: string) {
    // First get current players
    const session = await this.get(sessionId);
    const currentPlayers = session.players || [];
    
    const { error } = await supabase
      .from('game_sessions')
      .update({
        players: [...currentPlayers, { id: userId, isOnline: true }]
      })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  async removePlayer(sessionId: string, userId: string) {
    const session = await this.get(sessionId);
    const updatedPlayers = (session.players || []).filter(p => p.id !== userId);
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ players: updatedPlayers })
      .eq('id', sessionId);
    
    if (error) throw error;
  },

  async dealCards(sessionId: string, userId: string): Promise<Card[]> {
    // First get the session to check the state
    const session = await this.get(sessionId);
    
    // Get undelt cards (not in any player's hand or in play)
    const { data: availableCards, error: cardsError } = await supabase
      .from('cards')
      .select('*')
      .not('id', 'in', [
        ...(session.cards_in_play || []),
        ...(session.discard_pile || [])
      ])
      .order('RANDOM()')
      .limit(3);
    
    if (cardsError) throw cardsError;
    
    if (!availableCards) {
      throw new Error('No cards available to deal');
    }

    // Update session with the dealt cards for this player
    const { error: updateError } = await supabase
      .from('game_sessions')
      .update({
        [`player_hands`]: {
          ...session.player_hands,
          [userId]: availableCards.map(card => card.id)
        }
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;
    
    return availableCards as Card[];
  },

  // Subscribe to changes in a game session
  subscribeToChanges(sessionId: string, callback: (session: GameSession) => void) {
    return supabase
      .channel(`game_session:${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`
        }, 
        (payload) => callback(payload.new as GameSession)
      )
      .subscribe();
  }
};

// Helper functions for exchanges
export const exchangesTable = {
  async create(exchange: Omit<Exchange, 'id' | 'created_at' | 'status'>) {
    const { data, error } = await supabase
      .from('exchanges')
      .insert([{ ...exchange, status: 'pending' }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Exchange;
  },

  async updateStatus(exchangeId: string, status: Exchange['status']) {
    const { data, error } = await supabase
      .from('exchanges')
      .update({ status })
      .eq('id', exchangeId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Exchange;
  },

  subscribeToChanges(sessionId: string, callback: (exchanges: Exchange[]) => void) {
    return supabase
      .channel(`exchanges:${sessionId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exchanges',
          filter: `session_id=eq.${sessionId}`
        },
        async () => {
          // When any exchange changes, fetch all exchanges for the session
          const { data } = await supabase
            .from('exchanges')
            .select('*')
            .eq('session_id', sessionId);
          callback(data as Exchange[]);
        }
      )
      .subscribe();
  }
};

export const roomsTable = {
  async create(name: string, createdBy: string, settings?: Partial<RoomSettings>): Promise<Room> {
    // Generate a 6-character alphanumeric passcode
    const passcode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const roomData = {
      name,
      created_by: createdBy,
      passcode,
      game_mode: 'irl',
      is_active: true,
      players: [],
      settings: {
        allow_card_exchanges: true,
        allow_ripple_effects: true,
        rounds_per_player: 3,
        card_selection_time: 30,
        base_sharing_time: 120,
        ...settings
      }
    };

    console.log('Creating room with data:', roomData);
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create room:', {
        error,
        errorMessage: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Room created successfully:', data);
    return data as Room;
  },

  async join(passcode: string, player: Omit<RoomPlayer, 'joined_at'>): Promise<Room> {
    // First find the room
    const { data: room, error: findError } = await supabase
      .from('rooms')
      .select()
      .eq('passcode', passcode.toUpperCase())
      .eq('is_active', true)
      .single();
    
    if (findError) throw findError;
    if (!room) throw new Error('Room not found');

    // Add player to room
    const newPlayer = {
      ...player,
      joined_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('rooms')
      .update({
        players: [...(room.players || []), newPlayer]
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
      .select()
      .eq('id', roomId)
      .single();
    
    if (error) throw error;
    return data as Room;
  },

  async updatePlayerStatus(roomId: string, playerId: string, isActive: boolean): Promise<void> {
    const room = await this.get(roomId);
    const updatedPlayers = room.players.map(player => 
      player.id === playerId
        ? {
            ...player,
            is_active: isActive,
            last_seen_at: new Date().toISOString()
          }
        : player
    );

    const { error } = await supabase
      .from('rooms')
      .update({ players: updatedPlayers })
      .eq('id', roomId);

    if (error) throw error;
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

  subscribeToRoom(roomId: string, callback: (room: Room) => void) {
    return supabase
      .channel(`room:${roomId}`)
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