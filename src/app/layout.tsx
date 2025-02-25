"use client";

import "./globals.css";
import React from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "../context/AuthProvider";

// Define the theme using createTheme for better maintainability
const theme = createTheme({
  primaryColor: "primary", // Add this line
  colors: {
    // Primary palette: Gentle lavender shades
    primary: [
      "#F5F0FF", // 0: Lightest lavender
      "#EBE3FF", // 1
      "#D9C8FF", // 2
      "#C4ACFF", // 3
      "#AB8DFF", // 4
      "#916DFF", // 5: Primary accent
      "#744EFF", // 6
      "#5C32FF", // 7
      "#4616FF", // 8
      "#3000FF", // 9: Darkest
    ],
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Unspoken</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <AuthProvider>
            <Notifications />
            {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
