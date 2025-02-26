// src/components/game/GamePhases/Endgame.tsx
import { useEffect, useState } from "react";
import {
  Container,
  Stack,
  Title,
  Text,
  Group,
  Button,
  Paper,
  Badge,
  Loader,
} from "@mantine/core";
import {
  IconRepeat,
  IconArrowRight,
  IconExchange,
  IconInfoCircle,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { motion } from "framer-motion";
import { useRoomMembers } from "@/context/RoomMembersProvider";
import { useCardsInGame } from "@/context/CardsInGameProvider";
import { useFullRoom } from "@/context/FullRoomProvider";
import { roomsService } from "@/services/supabase/rooms";
import { useRoom } from "@/context/RoomProvider";
import { FadeIn } from "@/components/animations/Motion";
import { getPlayerAssignments } from "../statusBarUtils";
import {
  RoomSettings,
  EnrichedExchangeRequest,
  GameMode,
} from "@/core/game/types";
import { GameSettingsForm } from "@/components/room/GameSettingsForm";
import { PlayerCardGrid, PlayerCardInfo } from "../PlayerCardGrid";
import {
  getAllMatchedExchanges,
  enrichExchanges,
  groupExchangesByReceiver,
} from "@/services/supabase/exchangeUtils";

type EndgameProp = {
  roomId: string;
};

export function Endgame({ roomId }: EndgameProp) {
  const { room } = useRoom();
  const { members, currentMember } = useRoomMembers();
  const { cardState, getCardById } = useCardsInGame();
  const { isCreator, startNextRound } = useFullRoom();
  const [nextRoundSettings, setNextRoundSettings] = useState<
    Partial<RoomSettings>
  >({
    deal_extras: true,
    card_depth: null,
    is_exchange: true,
    game_mode: "irl" as GameMode,
  });
  const [loading, setLoading] = useState(false);
  const [matchedExchanges, setMatchedExchanges] = useState<
    EnrichedExchangeRequest[]
  >([]);
  const [loadingExchanges, setLoadingExchanges] = useState(false);

  const playerAssignments = getPlayerAssignments(members, roomId);

  // Load all matched exchanges for the room
  useEffect(() => {
    const fetchMatchedExchanges = async () => {
      if (!roomId) return;
      setLoadingExchanges(true);
      console.log("Fetched matched exchanges");
      try {
        const exchanges = await getAllMatchedExchanges(roomId);
        const enrichedExchanges = enrichExchanges(
          exchanges,
          getCardById,
          members,
        );
        setMatchedExchanges(enrichedExchanges);
      } catch (error) {
        console.error("Failed to load matched exchanges:", error);
      } finally {
        setLoadingExchanges(false);
      }
    };

    fetchMatchedExchanges();
  }, [roomId, getCardById]);

  useEffect(() => {
    if (room?.card_depth) {
      setNextRoundSettings((prev) => ({
        ...prev,
        card_depth: room?.card_depth,
      }));
    }
  }, [room?.card_depth]);

  // Map regular player cards for display
  const playerCardsInfo: PlayerCardInfo[] = Object.entries(
    cardState.selectedCards,
  )
    .map(([playerId, cardId]) => {
      const player = members.find((m) => m.id === playerId);
      const card = getCardById(cardId);

      if (!card) return null;

      const contributorId = card.contributor_id;
      const contributor = contributorId
        ? members.find((m) => m.id === contributorId)
        : undefined;

      return {
        playerId,
        playerName: player?.username || "Unknown Player",
        playerAssignment: playerAssignments.get(playerId),
        card: card,
        contributorId,
        contributorName: contributor?.username,
        contributorAssignment: contributorId
          ? playerAssignments.get(contributorId)
          : undefined,
      };
    })
    .filter(Boolean) as PlayerCardInfo[]; // Filter out any null entries

  // Combine all exchange cards into a single array for unified display
  const getAllExchangeCards = (): PlayerCardInfo[] => {
    const allExchangeCards: PlayerCardInfo[] = [];

    // Group exchanges by receiver
    const exchangesByReceiver = groupExchangesByReceiver(matchedExchanges);

    // For each receiver, process their exchanges
    exchangesByReceiver.forEach((exchanges) => {
      exchanges.forEach((exchange) => {
        const receiver = members.find((m) => m.id === exchange.to_id);

        allExchangeCards.push({
          playerId: exchange.to_id, // The person who will respond to this card
          playerName: receiver?.username || "Unknown Player",
          playerAssignment: playerAssignments.get(exchange.to_id),
          card: exchange.card!,
          contributorId: exchange.from_id, // The person who sent this challenge
          contributorName: exchange.otherPlayer?.username,
          contributorAssignment: playerAssignments.get(exchange.from_id),
        });
      });
    });

    return allExchangeCards;
  };

  const handleStartExchange = async () => {
    if (!isCreator || !roomId) return;

    setLoading(true);
    try {
      const exchangeSuccess = await roomsService.startExchangeRound(roomId);
      console.log(`Exchange success: ${exchangeSuccess}`);

      notifications.show({
        title: "Success",
        message: "Exchange round started!",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to start exchange round:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start exchange round",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewGame = async () => {
    if (!isCreator) return;

    setLoading(true);
    try {
      // Reset is_exchange to false for a completely new game
      const newGameSettings = {
        ...nextRoundSettings,
        is_exchange: false,
      };

      await startNextRound(newGameSettings);

      notifications.show({
        title: "Success",
        message: "New game started!",
        color: "green",
      });
    } catch (error) {
      console.error("Failed to start new game:", error);
      notifications.show({
        title: "Error",
        message: "Failed to start new game",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderExchangeSection = () => {
    if (room?.is_exchange) {
      console.log("Room already has exchange");
      return renderPlayAgainSection();
    }

    if (loadingExchanges) {
      return (
        <Paper p="md" radius="md" withBorder mt="md">
          <Stack align="center" py="md">
            <Loader size="sm" />
            <Text c="dimmed">Loading exchange data...</Text>
          </Stack>
        </Paper>
      );
    }

    // Get all exchange cards
    const allExchangeCards = getAllExchangeCards();

    if (allExchangeCards.length === 0) {
      return renderPlayAgainSection();
    }

    // has some exchanges to do
    return (
      <Paper p="md" radius="md" withBorder mt="xs">
        <Stack gap="xs">
          <Group align="center">
            <IconExchange size={20} />
            <Title order={4}>Exchange Round</Title>
            <Badge color="blue">New</Badge>
          </Group>

          <Text>
            Players have matched exchanges! Time for a special round where
            everyone responds to the cards they've been challenged with.
          </Text>

          <PlayerCardGrid
            cardInfos={allExchangeCards}
            showSender={true}
            animate={false}
            highlightPlayerId={currentMember?.id || null}
          />

          {isCreator && (
            <Group justify="center" mt="md">
              <Button
                size="md"
                leftSection={<IconExchange size={18} />}
                onClick={handleStartExchange}
                color="blue"
                loading={loading}
              >
                Start Exchange Round
              </Button>
            </Group>
          )}

          {!isCreator && (
            <Text ta="center" c="dimmed" mt="md">
              Waiting for the room creator to start the exchange round...
            </Text>
          )}
        </Stack>
      </Paper>
    );
  };

  const renderPlayAgainSection = () => {
    return (
      <Paper p="md" radius="md" withBorder mt="md">
        <Stack gap="md">
          <Title order={4}>Play Again?</Title>

          <GameSettingsForm onChange={setNextRoundSettings} />

          <Group justify="center" mt="sm">
            <Button
              size="md"
              leftSection={<IconRepeat size={18} />}
              onClick={handleStartNewGame}
              color="indigo"
              disabled={!isCreator}
              loading={loading}
            >
              {isCreator
                ? "Start New Game"
                : "Waiting for creator to start new game..."}
            </Button>
            <Button
              size="md"
              rightSection={<IconArrowRight size={18} />}
              variant="outline"
              color="gray"
              onClick={() => (window.location.href = "/")}
            >
              Exit Game
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  };

  return (
    <Container size="lg" py="md">
      <Stack gap="xs">
        <FadeIn>
          <Title order={2} ta="center">
            {room?.is_exchange ? "Exchange Round Complete" : "Game Complete"}
          </Title>
          <Text ta="center" size="md" c="dimmed" mb="xs">
            Thanks for playing! Here's what everyone shared:
          </Text>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Group align="center" mb="xs">
            <IconInfoCircle size={16} color="blue" />
            <Text size="sm" c="blue" fs="italic">
              Your card is highlighted in blue
            </Text>
          </Group>

          <PlayerCardGrid
            cardInfos={playerCardsInfo}
            showSender={false}
            highlightPlayerId={currentMember?.id || null}
          />
        </motion.div>

        {/* Show exchange section if available, otherwise show play again */}
        {renderExchangeSection()}
      </Stack>
    </Container>
  );
}
