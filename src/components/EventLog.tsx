/**
 * EventLog.tsx — Detective's case log panel
 *
 * Displays a chronological list of investigation events: moves, examinations,
 * clue discoveries, conversations, and accusations. Newest entries at the
 * bottom; auto-scrolls on new entries.
 */

import { useRef, useEffect } from "react";
import type { EventEntry } from "../../lib/events";

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------

function EventRow({ entry }: { entry: EventEntry }) {
  const isClue = entry.type === "examine_clue";
  const isSolved = entry.type === "theory_solved";
  const isFailed = entry.type === "theory_wrong" || entry.type === "theory_close";

  const borderClass = isClue
    ? "border-l-[3px] border-l-[var(--accent-clue)]"
    : isSolved
      ? "border-l-[3px] border-l-emerald-600"
      : isFailed
        ? "border-l-[3px] border-l-[var(--accent-danger)]"
        : "border-l-[3px] border-l-[var(--border-warm)]";

  return (
    <div className={["py-2 px-3 hover:bg-[#0f0e0d]", borderClass].join(" ")}>
      <div className="flex items-start gap-1.5">
        <span className="shrink-0 text-xs leading-5">{entry.icon}</span>
        <span
          className={[
            "text-xs leading-5 flex-1",
            isClue
              ? "text-amber-400 font-medium"
              : isSolved
                ? "text-green-400 font-medium"
                : isFailed
                  ? "text-red-400"
                  : "text-neutral-300",
          ].join(" ")}
        >
          {entry.description}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventLog panel
// ---------------------------------------------------------------------------

interface EventLogProps {
  eventLog: EventEntry[];
}

export function EventLog({ eventLog }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [eventLog.length]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-[var(--border-subtle)]">
        <h2
          className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--text-muted)]"
          style={{ fontVariant: "small-caps" }}
        >
          CASE FILE
        </h2>
      </div>

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto py-1">
        {eventLog.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic px-3 pt-2">
            No entries in the case file.
          </p>
        ) : (
          eventLog.map((entry, i) => <EventRow key={`${entry.timestamp}-${i}`} entry={entry} />)
        )}
        {/* Sentinel for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
