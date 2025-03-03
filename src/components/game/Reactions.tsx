import React, { useState } from "react";
import { Group, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconHeart,
  IconRipple,
  IconMicrophone,
  IconQuestionMark,
} from "@tabler/icons-react";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import type { ReactionType } from "@/services/supabase/reactions";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { useReactions } from "@/context/ReactionsProvider";

// Reaction types
const REACTIONS = [
  { id: "resonates" as ReactionType, icon: IconHeart, label: "Resonates" },
  {
    id: "tellmemore" as ReactionType,
    icon: IconQuestionMark,
    label: "Request response",
  },
] as const;

interface ReactionsProps {
  toId: string;
  cardId: string; // The card ID
}

export function Reactions({ toId, cardId }: ReactionsProps) {
  const { recording, setRecording } = useAudioMessages();
  const { toggleReaction, toggleRipple, hasTellMeMore, isRippled, loading } =
    useReactions();

  // Store temporary "button disabled" state for UI feedback
  const [disabledButtons, setDisabledButtons] = useState<
    Record<ReactionType, boolean>
  >({} as Record<ReactionType, boolean>);
  const [rippleDisabled, setRippleDisabled] = useState(false);

  // Check if the user has requested a response or rippled this card
  const hasRequestedResponse = hasTellMeMore(toId);
  const rippled = isRippled(toId, cardId);

  const handleReactionClick = async (id: ReactionType) => {
    // Disable button to prevent spam clicking
    setDisabledButtons((prev) => ({ ...prev, [id]: true }));

    try {
      // Toggle reaction using provider method
      await toggleReaction(toId, cardId, id);
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
    setRippleDisabled(true);

    try {
      await toggleRipple(toId, cardId);
    } catch (error) {
      console.error("Failed to toggle ripple:", error);
    } finally {
      setTimeout(() => {
        setRippleDisabled(false);
      }, 2000);
    }
  };

  const handleRecordStart = async () => {
    setRecording(true);
    if (hasRequestedResponse) {
      // this recording is specifically in response to the other player's request
      console.log(`Responding to ${toId} request. CardId: ${cardId}`);
    }
    // send a "metoo"
    await toggleReaction(toId, cardId, "metoo");
  };

  const handleRecordComplete = async () => {
    setRecording(false);
    // remove the "metoo"
    await toggleReaction(toId, cardId, "metoo");
  };

  return (
    <Group justify="center" gap="xs">
      {!recording ? (
        <>
          {/* Reaction Buttons */}
          {REACTIONS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id} label={label}>
              <ActionIcon
                variant={hasRequestedResponse ? "filled" : "subtle"}
                color="blue"
                onClick={() => handleReactionClick(id)}
                radius="xl"
                size="lg"
                disabled={disabledButtons[id] || loading}
                style={disabledButtons[id] ? { opacity: 0.5 } : {}}
              >
                <Icon size={18} />
              </ActionIcon>
            </Tooltip>
          ))}

          {/* Ripple Button */}
          <Tooltip label="Save for later (Ripple)">
            <ActionIcon
              variant={rippled ? "filled" : "subtle"}
              color="violet"
              onClick={handleRippleClick}
              radius="xl"
              size="lg"
              disabled={rippleDisabled || loading}
              style={rippleDisabled ? { opacity: 0.5 } : {}}
            >
              <IconRipple size={18} />
            </ActionIcon>
          </Tooltip>
        </>
      ) : (
        /* Audio Recorder (shown when recording) */
        <AudioRecorder
          onComplete={handleRecordComplete}
          targetPlayerId={toId}
        />
      )}

      {/* Record Button */}
      {!recording && (
        <Tooltip label="Record a response">
          <ActionIcon
            variant={hasRequestedResponse ? "filled" : "subtle"}
            color="red"
            onClick={handleRecordStart}
            radius="xl"
            size="lg"
            disabled={loading}
          >
            <IconMicrophone size={18} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
