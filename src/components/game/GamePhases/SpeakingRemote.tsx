// src/components/game/GamePhases/SpeakingRemote.tsx
import React, { useState, useEffect } from "react";
import { 
  Stack, 
  Button, 
  Text, 
  Paper, 
  Title, 
  Tabs, 
  Group, 
  ScrollArea, 
  Box
} from "@mantine/core";
import { 
  IconMessage, 
  IconUser 
} from "@tabler/icons-react";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useRoom } from "@/context/RoomProvider";
import { PlayerAvatar } from "../PlayerAvatar";
import { getPlayerAssignments } from "../statusBarUtils";
import { useAudioMessages } from "@/context/AudioMessagesProvider";
import { AudioPlayer } from "@/components/AudioMessage/AudioPlayer";
import { AudioRecorder } from "@/components/AudioMessage/AudioRecorder";
import { MiniCard } from "../CardDeck/MiniCard";

type SpeakingRemoteProp = {
  roomId: string;
};

export function SpeakingRemote({ roomId }: SpeakingRemoteProp) {
  const { finishSpeaking, isCreator } = useRoom();
  const { cardState, getCardById } = useCardsInGame();
  const { members, currentMember } = useRoomMembers();
  const { messagesByCard, loading: audioLoading, recording, setRecording } = useAudioMessages();
  
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [targetCardId, setTargetCardId] = useState<string | null>(null);

  const playerAssignments = getPlayerAssignments(members, roomId);

  // Create a simple mapping of cards to players for easy lookup
  const cardPlayerMap = Object.entries(cardState.selectedCards).reduce((map, [playerId, cardId]) => {
    map[cardId] = playerId;
    return map;
  }, {} as Record<string, string>);

  // Set first tab as active by default
  useEffect(() => {
    if (Object.keys(cardState.selectedCards).length > 0 && !activeTab) {
      // If current user's card exists, select it first
      const currentUserCardId = cardState.selectedCards[currentMember?.id || ''];
      if (currentUserCardId) {
        setActiveTab(currentUserCardId);
      } else {
        // Otherwise, select the first card
        const firstPlayerId = Object.keys(cardState.selectedCards)[0];
        setActiveTab(cardState.selectedCards[firstPlayerId]);
      }
    }
  }, [cardState.selectedCards, activeTab, currentMember?.id]);

  const handleEndReviewingPhase = async () => {
    if (isCreator) {
      try {
        await finishSpeaking();
      } catch (error) {
        console.error("Failed to end reviewing phase:", error);
      }
    }
  };

  const handleRecordToggle = (cardId: string) => {
    setTargetCardId(cardId);
    setIsRecording(true);
    setRecording(true);
  };

  const handleRecordComplete = () => {
    setIsRecording(false);
    setRecording(false);
    setTargetCardId(null);
  };

  // Create tab items from all cards
  const tabItems = Object.entries(cardState.selectedCards).map(([playerId, cardId]) => {
    const player = members.find(m => m.id === playerId);
    const card = getCardById(cardId);
    if (!card) return null;

    const playerAssignment = playerAssignments.get(playerId);
    const isCurrentUser = playerId === currentMember?.id;
    
    // Check if there are unread messages for this card
    const cardMessages = messagesByCard.get(cardId) || [];
    const hasMessages = cardMessages.length > 0;
    const hasUnreadMessages = cardMessages.some(msg => msg.sender_id !== currentMember?.id);

    return {
      value: cardId,
      label: player?.username || "Unknown Player",
      playerAssignment,
      isCurrentUser,
      hasUnreadMessages,
      card
    };
  }).filter(Boolean);

  // Render the conversation interface for the active tab
  const renderConversation = () => {
    if (!activeTab) return null;
    
    const playerId = cardPlayerMap[activeTab];
    const card = getCardById(activeTab);
    const player = members.find(m => m.id === playerId);
    
    if (!card || !player) return null;

    const isCurrentUserCard = playerId === currentMember?.id;
    const playerAssignment = playerAssignments.get(playerId);
    const cardMessages = messagesByCard.get(activeTab) || [];
    
    // Sort messages by creation time
    const sortedMessages = [...cardMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return (
      <Stack gap="md">
        {/* Card Display */}
        <Paper p="md" withBorder shadow="sm">
          <Group justify="space-between">
            <Group>
              {playerAssignment && (
                <PlayerAvatar
                  assignment={playerAssignment}
                  size="md"
                  highlighted={isCurrentUserCard}
                />
              )}
              <Text fw={500}>{player.username}'s card</Text>
            </Group>
            <MiniCard
              card={card}
              size="sm"
              isHighlighted={isCurrentUserCard}
            />
          </Group>
        </Paper>

        {/* Conversation Thread */}
        <Paper p="md" withBorder shadow="sm">
          <Stack gap="md">
            <Text fw={500}>Conversation</Text>
            
            <ScrollArea h={400} offsetScrollbars>
              <Stack gap="md">
                {sortedMessages.length === 0 ? (
                  <Text c="dimmed" ta="center" py="xl">
                    No messages yet. Be the first to respond!
                  </Text>
                ) : (
                  sortedMessages.map((message) => {
                    const sender = members.find(m => m.id === message.sender_id);
                    const isSelf = message.sender_id === currentMember?.id;
                    const senderAssignment = playerAssignments.get(message.sender_id);
                    
                    return (
                      <Box 
                        key={message.id}
                        style={{ 
                          alignSelf: isSelf ? 'flex-end' : 'flex-start',
                          maxWidth: '80%'
                        }}
                      >
                        <Stack gap="xs">
                          <Group gap="xs">
                            {!isSelf && senderAssignment && (
                              <PlayerAvatar
                                assignment={senderAssignment}
                                size="sm"
                              />
                            )}
                            <Text size="sm" c="dimmed">
                              {isSelf ? "You" : sender?.username || "Unknown"}
                            </Text>
                          </Group>
                          <AudioPlayer key={message.id} message={message} />
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            </ScrollArea>
            
            {/* Audio Recorder */}
            {!isRecording ? (
              <Button 
                onClick={() => handleRecordToggle(activeTab)}
                disabled={recording}
                leftSection={<IconMessage size={16} />}
              >
                Record Response
              </Button>
            ) : (
              <Paper p="md" withBorder radius="md" shadow="sm">
                <AudioRecorder
                  isPublic={true}
                  targetPlayerId={playerId}
                  cardId={targetCardId}
                  onComplete={handleRecordComplete}
                />
              </Paper>
            )}
          </Stack>
        </Paper>
      </Stack>
    );
  };

  return (
    <Stack gap="md">
      <Title order={3} ta="center">
        Conversations
      </Title>
      <Text ta="center" c="dimmed">
        Review and respond to each player's card.
      </Text>

      {audioLoading ? (
        <Text ta="center" c="dimmed">Loading conversations...</Text>
      ) : (
        <Tabs 
          value={activeTab} 
          onChange={setActiveTab}
          keepMounted={false}
        >
          <Tabs.List grow>
            {tabItems.map((item) => (
              <Tabs.Tab 
                key={item.value} 
                value={item.value}
                leftSection={
                  item.playerAssignment ? (
                    <PlayerAvatar 
                      assignment={item.playerAssignment} 
                      size="xs"
                      highlighted={item.isCurrentUser}
                    />
                  ) : (
                    <IconUser size={16} />
                  )
                }
                rightSection={item.hasUnreadMessages ? (
                  <Box style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'red' }} />
                ) : null}
              >
                {item.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Box p="md">
            {renderConversation()}
          </Box>
        </Tabs>
      )}

      {isCreator && (
        <Stack align="center" mt="md">
          <Button onClick={handleEndReviewingPhase}>End Reviewing Phase</Button>
        </Stack>
      )}
    </Stack>
  );
}