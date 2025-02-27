import { Text, Title, TitleOrder } from "@mantine/core";

interface UnspokenGameIconProps {
  size?: string; // Supports Mantine sizes ("xs", "sm", "md", "lg", "xl") or pixel values
}

const UnspokenGameIcon = ({ size = "xl" }: UnspokenGameIconProps) => {
  return (
    <Text size={size} fw={700} style={{ display: "inline-flex" }}>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
          marginRight: "-5px",
        }}
      >
        u
      </span>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
        }}
      >
        n
      </span>
      <span>spoken</span>
    </Text>
  );
};

interface UnspokenGameTitleProps {
  order?: TitleOrder;
}

const UnspokenGameTitle = ({ order = 1 }: UnspokenGameTitleProps) => {
  return (
    <Title order={order} fw={700} style={{ display: "inline-flex" }}>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
          marginRight: "-10px",
        }}
      >
        u
      </span>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
        }}
      >
        n
      </span>
      <span>spoken</span>
    </Title>
  );
};

const UnspokenGameIconSmall = ({ size = "xl" }: UnspokenGameIconProps) => {
  return (
    <Text size={size} fw={700} style={{ display: "inline-flex" }}>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
          marginRight: "-5px",
        }}
      >
        u
      </span>
      <span
        style={{
          textDecoration: "line-through",
          color: "red",
          position: "relative",
        }}
      >
        n
      </span>
    </Text>
  );
};

export { UnspokenGameIcon, UnspokenGameIconSmall, UnspokenGameTitle };
