import { supabase } from './client';
import type { Card } from '@/core/game/types';

export type ReactionType = 'inspiring' | 'resonates' | 'metoo';

export interface ListenerReaction {
  id: string;
  roomId: string;
  speakerId: string;
  listenerId: string;
  cardId: string;
  type: ReactionType;
  isPrivate: boolean;
  rippleMarked: boolean;
}

export const reactionsService = {
  async toggleReaction(
    roomId: string,
    speakerId: string,
    listenerId: string,
    cardId: string,
    type: ReactionType,
    isPrivate = true
  ): Promise<void> {
    // Check if reaction exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        type
      })
      .single();

    if (existing) {
      // Remove existing reaction
      await supabase
        .from('reactions')
        .delete()
        .match({
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          type
        });
    } else {
      // Add new reaction
      await supabase
        .from('reactions')
        .insert([{
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          type,
          is_private: isPrivate
        }]);
    }
  },

  async toggleRipple(
    roomId: string,
    speakerId: string,
    listenerId: string,
    cardId: string
  ): Promise<void> {
    // Check if ripple exists
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        ripple_marked: true
      })
      .single();

    if (existing) {
      // Remove ripple
      await supabase
        .from('reactions')
        .delete()
        .match({
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          ripple_marked: true
        });
    } else {
      // Add ripple
      await supabase
        .from('reactions')
        .insert([{
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          ripple_marked: true
        }]);
    }
  },

  async getPlayerReactions(
    roomId: string,
    listenerId: string
  ): Promise<ListenerReaction[]> {
    const { data } = await supabase
      .from('reactions')
      .select('*')
      .match({
        room_id: roomId,
        listener_id: listenerId
      });

    return data || [];
  },

  async getRippledCards(
    roomId: string,
    playerId: string
  ): Promise<Card[]> {
    const { data: reactions } = await supabase
      .from('reactions')
      .select('card_id')
      .match({
        room_id: roomId,
        listener_id: playerId,
        ripple_marked: true
      });

    if (!reactions?.length) return [];

    const cardIds = reactions.map(r => r.card_id);
    
    const { data: cards } = await supabase
      .from('cards')
      .select('*')
      .in('id', cardIds);

    return cards || [];
  },

  subscribeToReactions(
    roomId: string,
    callback: (reactions: ListenerReaction[]) => void
  ) {
    return supabase
      .channel(`reactions:${roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'reactions',
          filter: `room_id=eq.${roomId}`
        }, 
        async () => {
          const { data } = await supabase
            .from('reactions')
            .select('*')
            .eq('room_id', roomId);
          callback(data || []);
        }
      )
      .subscribe();
  }
};