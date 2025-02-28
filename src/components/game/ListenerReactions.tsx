import React, { useState, useEffect } from "react";
import { Group, ActionIcon, Tooltip, Badge } from "@mantine/core";
import {
  IconHeart,
  IconRipple,
  IconMicrophone,
  IconQuestionMark
} from "@tabler/icons-react";
import { useReactions } from "@/hooks/game/useReactions";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import type { ReactionType } from "@/services/supabase/reactions";
import { useAudioMessages } from "@/context/AudioMessagesProvider";

// Updated reaction types
const REACTIONS = [
  { id: "resonates" as ReactionType, icon: IconHeart, label: "Resonates" },
  { id: "tellmemore" as ReactionType, icon: IconQuestionMark, label: "Request response" },
] as const;

interface ListenerReactionsProps {
  speakerId: string;     // The player who owns the card we're reacting to
  cardId: string;        // The card we're reacting to
  roomId: string;
  userId: string;        // Current user (the one doing the reacting)
}

export function ListenerReactions({
  speakerId,
  cardId,
  roomId,
  userId,
}: ListenerReactionsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { recording, setRecording } = useAudioMessages();
  
  // Get reaction state
  const { 
    reactions,
    toggleReaction, 
    toggleRipple, 
    hasReaction, 
    isRippled
  } = useReactions({
    roomId,
    speakerId,   // The player who owns the card
    listenerId: userId,  // Current user doing the reacting
    cardId,
  });

  // Store temporary "button disabled" state
  const [disabledButtons, setDisabledButtons] = useState<
    Record<ReactionType, boolean>
  >({} as Record<ReactionType, boolean>);
  const [rippleDisabled, setRippleDisabled] = useState(false);

  // Check if the user has already requested a response
  const hasRequestedResponse = hasReaction("tellmemore");
  
  // Check if the user has already rippled this card
  const rippled = isRippled();

  const handleReactionClick = async (id: ReactionType) => {
    // Disable button to prevent spam clicking
    setDisabledButtons((prev) => ({ ...prev, [id]: true }));
    
    try {
      // Toggle reaction in the database
      await toggleReaction(id, true);
    } catch (error) {
      console.error(`Failed to toggle ${id} reaction:`, error);
    } finally {
      // Re-enable button after a delay
      setTimeout(() => {
        setDisabledButtons((prev) => ({ ...prev, [id]: false }));
      }, 1000);
    }
  };

  const handleRippleClick = async () => {
    // Disable ripple button to prevent spam clicking
    setRippleDisabled(true);
    
    try {
      await toggleRipple();
    } catch (error) {
      console.error("Failed to toggle ripple:", error);
    } finally {
      // Re-enable after a delay
      setTimeout(() => {
        setRippleDisabled(false);
      }, 2000);
    }
  };

  const handleRecordStart = async () => {
    setIsRecording(true);
    setRecording(true);
    
    // If we were requesting a response, clear the request when we start recording
    if (hasRequestedResponse) {
      try {
        await toggleReaction("tellmemore", true);
      } catch (error) {
        console.error("Failed to clear tellmemore reaction:", error);
      }
    }
    
    // Set metoo reaction to indicate recording in progress
    try {
      await toggleReaction("metoo", true);
    } catch (error) {
      console.error("Failed to set metoo reaction:", error);
    }
  };

  const handleRecordComplete = async () => {
    setIsRecording(false);
    setRecording(false);
    
    // Clear the metoo reaction when done recording
    try {
      if (hasReaction("metoo")) {
        await toggleReaction("metoo", true);
      }
    } catch (error) {
      console.error("Failed to clear metoo reaction:", error);
    }
  };

  // Update the recording state based on the context value
  useEffect(() => {
    if (!recording && isRecording) {
      setIsRecording(false);
    }
  }, [recording, isRecording]);

  return (
    <Group justify="center" gap="xs">
      {!isRecording ? (
        <>
          {REACTIONS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id} label={label}>
              <ActionIcon
                variant={hasReaction(id) ? "filled" : "subtle"}
                color="blue"
                onClick={() => handleReactionClick(id)}
                radius="xl"
                size="lg"
                disabled={disabledButtons[id]} 
                style={disabledButtons[id] ? { opacity: 0.5 } : {}}
              >
                <Icon size={18} />
              </ActionIcon>
            </Tooltip>
          ))}

          <Tooltip label="Save for later (Ripple)">
            <ActionIcon
              variant={rippled ? "filled" : "subtle"}
              color="violet"
              onClick={handleRippleClick}
              radius="xl"
              size="lg"
              disabled={rippleDisabled}
              style={rippleDisabled ? { opacity: 0.5 } : {}}
            >
              <IconRipple size={18} />
            </ActionIcon>
          </Tooltip>
        </>
      ) : (
        <AudioRecorder
          onComplete={handleRecordComplete}
          targetPlayerId={speakerId}
          isCompact={true}
        />
      )}

      {!isRecording && (
        <Tooltip label="Record a response">
          <ActionIcon
            variant={hasRequestedResponse ? "filled" : "subtle"}
            color="red"
            onClick={handleRecordStart}
            radius="xl"
            size="lg"
          >
            <IconMicrophone size={18} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}