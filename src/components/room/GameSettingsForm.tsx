// src/components/room/GameSettingsForm.tsx
import { useState } from "react";
import { NativeSelect, Group, Switch } from "@mantine/core";
import type { RoomSettings } from "@/core/game/types";

interface GameSettingsFormProps {
  initialSettings?: Partial<RoomSettings>;
  onChange: (settings: Partial<RoomSettings>) => void;
}

export function GameSettingsForm({
  initialSettings = {},
  onChange,
}: GameSettingsFormProps) {
  const [settings, setSettings] = useState<Partial<RoomSettings>>({
    deal_extras: initialSettings.deal_extras || true,
    card_depth: initialSettings.card_depth ?? null,
    is_exchange: initialSettings.is_exchange || false,
    game_mode: initialSettings.game_mode || "irl",
  });

  const handleSettingChange = (updatedSettings: Partial<RoomSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const selectData = [
    { value: "0", label: "U13" },
    { value: "1", label: "neighbors" },
    { value: "2", label: "friends" },
    { value: "3", label: "besties" },
    { value: "all", label: "allow all" },
  ];

  return (
    <Group gap="xs" justify="flex-start">
      <Switch
        label="Play remote"
        description="Play remote"
        checked={settings.game_mode === "remote"}
        onChange={(event) => {
          handleSettingChange({
            game_mode: event.currentTarget.checked ? "remote" : "irl",
          });
        }}
      />
      <NativeSelect
        label="Card Depth"
        description={
          !settings.deal_extras
            ? "Need to enable Deal New Cards"
            : "Only deal new cards from this level"
        }
        data={selectData}
        value={
          settings.card_depth !== null && settings.card_depth !== undefined
            ? settings.card_depth.toString()
            : "all"
        }
        onChange={(event) =>
          handleSettingChange({
            card_depth:
              event.currentTarget.value === "all"
                ? null
                : (parseInt(event.currentTarget.value, 10) as 0 | 1 | 2 | 3),
          })
        }
        disabled={!settings.deal_extras}
        size="xs"
      />
    </Group>
  );
}
