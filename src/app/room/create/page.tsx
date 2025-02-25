"use client";

import { Container } from "@mantine/core";
import { CreateRoom } from "@/components/room/CreateRoom";

export default function CreateRoomPage() {
  return (
    <Container size="sm" py="xl">
      <CreateRoom />
    </Container>
  );
}
