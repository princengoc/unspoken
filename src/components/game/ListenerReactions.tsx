import React, { useState, useMemo } from "react";
import { Group, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconHeart,
  IconRipple,
  IconMicrophone,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useReactions } from "@/hooks/game/useReactions";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import type { ReactionType } from "@/services/supabase/reactions";

// Updated reaction types with "tellmemore" replacing "inspiring"
const REACTIONS = [
  { id: "resonates" as ReactionType, icon: IconHeart, label: "Resonates" },
  { id: "tellmemore" as ReactionType, icon: IconQuestionMark, label: "Tell me more" },
] as const;

interface ListenerReactionsProps {
  speakerId: string;
  cardId: string;
  roomId: string;
  userId: string;
}

export function ListenerReactions({
  speakerId,
  cardId,
  roomId,
  userId,
}: ListenerReactionsProps) {
  const [isRecording, setIsRecording] = useState(false);

  const { toggleReaction, toggleRipple, hasReaction, isRippled } = useReactions({
    roomId,
    speakerId,
    listenerId: userId,
    cardId,
  });

  // Store temporary "button disabled" state
  const [disabledButtons, setDisabledButtons] = useState<
    Record<ReactionType, boolean>
  >({} as Record<ReactionType, boolean>);
  const [rippleDisabled, setRippleDisabled] = useState(false);

  // Use `useMemo` to prevent unnecessary re-renders
  const activeReactions = useMemo(
    () =>
      Object.fromEntries(
        REACTIONS.map(({ id }) => [id, hasReaction(id)]),
      ) as Record<ReactionType, boolean>,
    [hasReaction],
  );

  const rippled = useMemo(() => isRippled(), [isRippled]);

  const handleReactionClick = async (id: ReactionType) => {
    // Always use private reactions
    await toggleReaction(id, true);

    // Disable button to prevent spam clicking
    setDisabledButtons((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setDisabledButtons((prev) => ({ ...prev, [id]: false }));
    }, 500);
  };

  const handleRippleClick = async () => {
    await toggleRipple();

    // Disable ripple button for 2 seconds
    setRippleDisabled(true);
    setTimeout(() => {
      setRippleDisabled(false);
    }, 2000);
  };

  const handleRecordStart = async () => {
    setIsRecording(true);
    // Send a "hang on, I want to say something" reaction when recording starts
    await toggleReaction("metoo", true);
  };

  const handleRecordComplete = () => {
    setIsRecording(false);
  };

  return (
    <Group justify="center" gap="xs">
      {!isRecording ? (
        <>
          {REACTIONS.map(({ id, icon: Icon, label }) => (
            <Tooltip key={id} label={label}>
              <ActionIcon
                variant={activeReactions[id] ? "filled" : "subtle"}
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
            variant="subtle"
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