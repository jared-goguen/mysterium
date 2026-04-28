/**
 * MysterySelect.tsx — Mystery selection screen
 *
 * Fetches available mysteries from GET /api/mysteries on mount,
 * renders a responsive grid of MysteryCard components.
 * Handles loading skeleton and error states.
 */

import { useEffect, useState } from "react";
import { MysteryCard } from "./MysteryCard";
import type { MysteryListItem } from "../../types/client";

interface MysterySelectProps {
  onSelect: (mysteryId: string) => void;
}

export function MysterySelect({ onSelect }: MysterySelectProps) {
  const [mysteries, setMysteries] = useState<MysteryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/mysteries")
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json().catch(() => ({
            error: res.statusText,
          }))) as {
            error?: string;
          };
          throw new Error(
            err.error ?? `Failed to load mysteries: ${res.status}`,
          );
        }
        return res.json() as Promise<MysteryListItem[]>;
      })
      .then((data) => {
        if (!cancelled) {
          setMysteries(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="vignette flex min-h-screen flex-col items-center bg-[var(--bg-primary)] px-6 py-16">
      <h1
        className="fade-in mb-2 font-serif text-5xl tracking-[0.2em] text-[var(--text-primary)]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        MYSTERIUM
      </h1>
      <p
        className="fade-in mb-14 font-serif text-sm italic tracking-wide text-[var(--text-muted)]"
        style={{
          animationDelay: "0.15s",
          animationFillMode: "both",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        Choose your mystery wisely. Each case leaves its mark.
      </p>

      {error && (
        <div className="mb-8 w-full max-w-2xl rounded border border-red-800 bg-red-950/50 p-4 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)]"
              style={{
                boxShadow: "0 0 8px rgba(201, 165, 75, 0.08)",
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mysteries.map((mystery) => (
            <MysteryCard
              key={mystery.id}
              mystery={mystery}
              onClick={() => onSelect(mystery.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
