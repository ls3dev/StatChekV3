"use client";

import { ReactNode, Suspense } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { PostHogProvider } from "./PostHogProvider";
import { AuthProvider } from "@/context/AuthContext";
import { ListsProvider } from "@/context/ListsContext";

export function Providers({ children }: { children: ReactNode }) {
  console.log("[Providers] Rendering...");
  return (
    <Suspense fallback={null}>
      <PostHogProvider>
        <ConvexClientProvider>
          <AuthProvider>
            <ListsProvider>{children}</ListsProvider>
          </AuthProvider>
        </ConvexClientProvider>
      </PostHogProvider>
    </Suspense>
  );
}
