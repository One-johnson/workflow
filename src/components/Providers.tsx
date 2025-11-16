'use client';

import type React from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from './ThemeProvider';

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
