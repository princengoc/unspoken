import React from "react";
import { CopyButton, Button } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

interface CopyCodeButtonProps {
  roomPasscode: string | null;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}

const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({
  roomPasscode,
  setOpened,
}) => {
  if (!roomPasscode) {
    return (
      <Button variant="light" color="gray" disabled>
        No Code Available
      </Button>
    );
  }

  return (
    <CopyButton value={roomPasscode} timeout={1100}>
      {({ copied, copy }) => (
        <Button
          variant="light"
          opacity={copied ? 0.7 : 1} // slightly fade when copied
          leftSection={
            copied ? <IconCheck size={16} /> : <IconCopy size={16} />
          }
          onClick={() => {
            copy();
            setTimeout(() => {
              setOpened(false);
            }, 1000);
          }}
        >
          {copied ? "Copied!" : "Copy Code"}
        </Button>
      )}
    </CopyButton>
  );
};

export default CopyCodeButton;
