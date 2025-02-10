import React, { ReactNode } from 'react';
import { Transition, Paper, Box, type PaperProps } from '@mantine/core';

interface BottomSheetProps extends Omit<PaperProps, 'transform'> {
  opened: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({ 
  opened, 
  onClose,
  children,
  style,
  ...props
}: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <Transition
        mounted={opened}
        transition="fade"
        duration={200}
      >
        {(styles) => (
          <Box
            style={{
              ...styles,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 200,
            }}
            onClick={onClose}
          />
        )}
      </Transition>

      {/* Sheet Content */}
      <Transition
        mounted={opened}
        transition="slide-up"
        duration={300}
      >
        {(styles) => (
          <Paper
            {...props}
            style={{
              ...styles,
              ...style,
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderTopLeftRadius: 'var(--mantine-radius-lg)',
              borderTopRightRadius: 'var(--mantine-radius-lg)',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              padding: 'var(--mantine-spacing-md)',
              zIndex: 201,
            }}
            shadow="sm"
            withBorder
          >
            {children}
          </Paper>
        )}
      </Transition>
    </>
  );
}