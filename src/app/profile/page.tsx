// src/app/profile/page.tsx
'use client';

import { Container } from '@mantine/core';
import { ProfileSettings } from '../auth/ProfileSettings';

export default function ProfilePage() {
  return (
    <Container size="sm" py="xl">
      <ProfileSettings />
    </Container>
  );
}