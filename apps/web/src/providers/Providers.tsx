"use client";

import { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ListsProvider } from "@/context/ListsContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        <ListsProvider>{children}</ListsProvider>
      </AuthProvider>
    </ConvexClientProvider>
  );
}
