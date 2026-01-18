"use client";

import { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConvexClientProvider>
  );
}
