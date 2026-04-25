/**
 * EventLog.tsx — Detective's case log panel
 *
 * Displays a chronological list of investigation events: moves, examinations,
 * clue discoveries, conversations, and accusations. Newest entries at the
 * bottom; auto-scrolls on new entries. Expandable detail for examine/clue/
 * conversation/accusation entries.
 */

import { useRef, useEffect, useState } from "react";
import type { LogEntry } from "../hooks/useMockGameState";

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICONS: Record<LogEntry["type"], string> = {
  move: "📍",
  examine: "🔎",
  clue: "🔍",
  conversation: "💬",
  accusation: "⚖️",
};

// ---------------------------------------------------------------------------
// Single event row
// ---------------------------------------------------------------------------

interface EventRowProps {
  entry: LogEntry;
}

function EventRow({ entry }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = Boolean(entry.detail);
  const isClue = entry.type === "clue";

  return (
    <div
      className={[
        "py-1.5 px-2 rounded",
        isClue ? "bg-amber-950/40" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        onClick={() => hasDetail && setExpanded((v) => !v)}
        className={[
          "flex items-start gap-1.5 w-full text-left",
          hasDetail ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        disabled={!hasDetail}
        aria-expanded={hasDetail ? expanded : undefined}
      >
        <span className="shrink-0 text-xs leading-5">{ICONS[entry.type]}</span>
        <span
          className={[
            "text-xs leading-5 flex-1",
            isClue
              ? "text-amber-400 font-medium"
              : "text-neutral-300",
          ].join(" ")}
        >
          {entry.text}
        </span>
        {hasDetail && (
          <span className="shrink-0 text-neutral-600 text-xs leading-5">
            {expanded ? "▲" : "▼"}
          </span>
        )}
      </button>

      {expanded && entry.detail && (
        <p className="mt-1 ml-5 text-xs text-neutral-500 leading-relaxed">
          {entry.detail}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventLog panel
// ---------------------------------------------------------------------------

interface EventLogProps {
  eventLog: LogEntry[];
}

export function EventLog({ eventLog }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [eventLog.length]);

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-neutral-800">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-neutral-400">
          Investigation Log
        </h2>
      </div>

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {eventLog.length === 0 ? (
          <p className="text-xs text-neutral-600 italic px-1 pt-1">
            Your investigation has not yet begun.
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
