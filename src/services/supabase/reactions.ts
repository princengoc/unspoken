// src/services/supabase/reactions.ts
import { supabase } from "./client";

export type ReactionType = "tellmemore" | "resonates" | "metoo";

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
    isPrivate: boolean = true,
  ): Promise<void> {
    // Check if reaction exists
    const { data: existing } = await supabase
      .from("reactions")
      .select("*")
      .match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        type,
      })
      .single();

    if (existing) {
      // Remove existing reaction
      await supabase.from("reactions").delete().match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        type,
      });
    } else {
      // Add new reaction
      await supabase.from("reactions").insert([
        {
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          type,
          is_private: isPrivate,
        },
      ]);
    }
  },

  async toggleRipple(
    roomId: string,
    speakerId: string,
    listenerId: string,
    cardId: string,
  ): Promise<void> {
    // Check if ripple exists
    const { data: existing } = await supabase
      .from("reactions")
      .select("*")
      .match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        ripple_marked: true,
      })
      .single();

    if (existing) {
      // Remove ripple
      await supabase.from("reactions").delete().match({
        room_id: roomId,
        speaker_id: speakerId,
        listener_id: listenerId,
        card_id: cardId,
        ripple_marked: true,
      });
    } else {
      // Add ripple
      await supabase.from("reactions").insert([
        {
          room_id: roomId,
          speaker_id: speakerId,
          listener_id: listenerId,
          card_id: cardId,
          ripple_marked: true,
        },
      ]);
    }
  },

  async getPlayerReactions(
    roomId: string,
    listenerId: string,
  ): Promise<ListenerReaction[]> {
    const { data } = await supabase.from("reactions").select("*").match({
      room_id: roomId,
      listener_id: listenerId,
    });

    return data || [];
  },

  async getRippledCards(roomId: string, playerId: string): Promise<string[]> {
    const { data: reactions } = await supabase
      .from("reactions")
      .select("card_id")
      .match({
        room_id: roomId,
        listener_id: playerId,
        ripple_marked: true,
      });

    if (!reactions?.length) return [];

    const cardIds = reactions.map((r) => r.card_id) as string[];

    return cardIds || [];
  },

  async getReactionsForSpeaker(
    roomId: string,
    speakerId: string,
    cardId: string,
  ): Promise<{ data: ListenerReaction[] }> {
    const { data, error } = await supabase.from("reactions").select("*").match({
      room_id: roomId,
      speaker_id: speakerId,
      card_id: cardId,
    });

    if (error) {
      console.error("Error fetching speaker reactions:", error);
      throw error;
    }

    return {
      data: data.map((item) => ({
        id: item.id,
        roomId: item.room_id,
        speakerId: item.speaker_id,
        listenerId: item.listener_id,
        cardId: item.card_id,
        type: item.type as ReactionType,
        isPrivate: item.is_private,
        rippleMarked: item.ripple_marked,
      })),
    };
  },

  subscribeToReactions(
    roomId: string,
    callback: (reactions: ListenerReaction[]) => void,
  ) {
    return supabase
      .channel(`reactions:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
          filter: `room_id=eq.${roomId}`,
        },
        async () => {
          const { data } = await supabase
            .from("reactions")
            .select("*")
            .eq("room_id", roomId);

          const mappedData = (data || []).map((item) => ({
            id: item.id,
            roomId: item.room_id,
            speakerId: item.speaker_id,
            listenerId: item.listener_id,
            cardId: item.card_id,
            type: item.type as ReactionType,
            isPrivate: item.is_private,
            rippleMarked: item.ripple_marked,
          }));
          callback(mappedData);
        },
      )
      .subscribe();
  },
};
