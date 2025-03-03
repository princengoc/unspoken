// src/services/supabase/reactions.ts
import { supabase } from "./client";

export type ReactionType = "tellmemore" | "resonates" | "metoo";

export interface Reaction {
  id: string;
  roomId: string;
  fromId: string; // the player that is sending this reaction
  toId: string; // the player that receives this reaction
  cardId: string;
  type: ReactionType;
  isPrivate: boolean;
  rippleMarked: boolean;
}

export const reactionsService = {
  async toggleReaction(
    roomId: string,
    toId: string,
    fromId: string,
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
        to_id: toId,
        from_id: fromId,
        card_id: cardId,
        type,
      })
      .maybeSingle();

    if (existing) {
      // Remove existing reaction
      await supabase.from("reactions").delete().match({
        room_id: roomId,
        to_id: toId,
        from_id: fromId,
        card_id: cardId,
        type,
      });
      console.log(`Deleted reactions of type ${type}`);
    } else {
      // Add new reaction
      await supabase.from("reactions").insert([
        {
          room_id: roomId,
          to_id: toId,
          from_id: fromId,
          card_id: cardId,
          type,
          is_private: isPrivate,
        },
      ]);
      console.log(`insert reactions of type ${type}`);
    }
  },

  async toggleRipple(
    roomId: string,
    toId: string,
    fromId: string,
    cardId: string,
  ): Promise<void> {
    // Check if ripple exists
    const { data: existing } = await supabase
      .from("reactions")
      .select("*")
      .match({
        room_id: roomId,
        to_id: toId,
        from_id: fromId,
        card_id: cardId,
        ripple_marked: true,
      })
      .maybeSingle();

    if (existing) {
      // Remove ripple
      await supabase.from("reactions").delete().match({
        room_id: roomId,
        to_id: toId,
        from_id: fromId,
        card_id: cardId,
        ripple_marked: true,
      });
    } else {
      // Add ripple
      await supabase.from("reactions").insert([
        {
          room_id: roomId,
          to_id: toId,
          from_id: fromId,
          card_id: cardId,
          ripple_marked: true,
        },
      ]);
    }
  },

  async getReactionsForRoom(roomId: string): Promise<Reaction[]> {
    const { data, error } = await supabase.from("reactions").select("*").match({
      room_id: roomId,
    });

    if (error) {
      console.error("Error fetching reactions:", error);
      throw error;
    }

    return data.map(mapReactionResponse);
  },

  // Subscribe to reactions changes for a room
  subscribeToReactions(
    roomId: string,
    callback: (reactions: Reaction[]) => void,
  ) {
    // Immediately get initial data
    this.getReactionsForRoom(roomId).then((reactions) => {
      callback(reactions);
    });

    // Subscribe to all changes
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
        async (payload) => {
          console.log("Reaction change detected:", payload.eventType);

          // Add small delay to ensure database consistency
          await new Promise((resolve) => setTimeout(resolve, 50));

          try {
            const reactions = await this.getReactionsForRoom(roomId);
            callback(reactions);
          } catch (error) {
            console.error("Error processing reaction change:", error);
          }
        },
      )
      .subscribe();
  },
};

// Helper function to map database response to our interface
function mapReactionResponse(item: any): Reaction {
  return {
    id: item.id,
    roomId: item.room_id,
    toId: item.to_id, // Speaker receiving the reaction
    fromId: item.from_id, // Listener giving the reaction
    cardId: item.card_id,
    type: item.type as ReactionType,
    isPrivate: item.is_private,
    rippleMarked: item.ripple_marked,
  };
}
