"use client";

import { useEffect } from "react";

// Catches errors that happen in the root layout itself.
// Must include <html> and <body> since it replaces the entire layout.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CleanClick global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #fee2e2",
              padding: "2rem",
              maxWidth: "540px",
              width: "100%",
            }}
          >
            <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
            <p style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1e293b", marginBottom: "0.5rem" }}>
              Application Error
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                Digest: {error.digest}
              </p>
            )}
            <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                background: "#0ea5e9",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "0.75rem 1.5rem",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
