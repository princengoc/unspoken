// src/components/room/GameSettingsForm.tsx
import { useState } from "react";
import { Select, Group, Switch } from "@mantine/core";
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
    card_depth: initialSettings.card_depth || null,
    is_exchange: initialSettings.is_exchange || false,
    game_mode: initialSettings.game_mode || 'irl'
  });

  const handleSettingChange = (updatedSettings: Partial<RoomSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);
    onChange(newSettings);
  };

  return (
    <Group gap="xs" justify="flex-start">
      <Switch
        label="Play remote"
        description="Play remote"
        checked={settings.game_mode === 'remote'}
        onChange={(event) => {
          handleSettingChange({ game_mode: event.currentTarget.checked ? 'remote' : 'irl' });
        }}
      />
      <Select
        label="Card Depth"
        description={
          !settings.deal_extras
            ? "Need to enable Deal New Cards"
            : "Only deal new cards from this level"
        }
        data={[
          { value: "all", label: "All Depths" },
          { value: "1", label: "Light (Level 1)" },
          { value: "2", label: "Medium (Level 2)" },
          { value: "3", label: "Deep (Level 3)" },
        ]}
        value={settings.card_depth ? settings.card_depth.toString() : "all"}
        onChange={(value) =>
          handleSettingChange({
            card_depth:
              value === "all" ? null : (parseInt(value as string) as 1 | 2 | 3),
          })
        }
        disabled={!settings.deal_extras}
      />
    </Group>
  );
}
