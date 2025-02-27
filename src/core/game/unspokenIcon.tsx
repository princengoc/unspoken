import { Text } from "@mantine/core";

const UnspokenGameIcon = () => {
  return (
    <Text size="xl" fw={700} style={{ display: "inline-flex" }}>
      <span style={{ textDecoration: "line-through", color: "red", position: "relative", marginRight: "-5px" }}>u</span>
      <span style={{ textDecoration: "line-through", color: "red", position: "relative" }}>n</span>
      <span>spoken</span>
    </Text>
  );
};

const UnspokenGameIconSmall = () => {
  return (
    <Text size="xl" fw={700} style={{ display: "inline-flex" }}>
      <span style={{ textDecoration: "line-through", color: "red", position: "relative", marginRight: "-5px" }}>u</span>
      <span style={{ textDecoration: "line-through", color: "red", position: "relative" }}>n</span>
    </Text>
  );
};

export { UnspokenGameIcon, UnspokenGameIconSmall };
