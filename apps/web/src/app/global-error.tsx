"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0a0a0f", color: "#ffffff", margin: 0 }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#9ca3af", marginBottom: "24px" }}>
              An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#7c3aed",
                  color: "white",
                  fontWeight: 500,
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <a
                href="/"
                style={{
                  padding: "10px 24px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontWeight: 500,
                  borderRadius: "12px",
                  textDecoration: "none",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
