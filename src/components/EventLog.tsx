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
  const isAccuseCorrect = entry.type === "accuse_correct";
  const isAccuseWrong = entry.type === "accuse_wrong" || entry.type === "accuse_partial";

  return (
    <div
      className={[
        "py-1.5 px-2 rounded",
        isClue ? "bg-amber-950/40" : "",
        isAccuseCorrect ? "bg-green-950/40" : "",
        isAccuseWrong ? "bg-red-950/30" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-1.5">
        <span className="shrink-0 text-xs leading-5">{entry.icon}</span>
        <span
          className={[
            "text-xs leading-5 flex-1",
            isClue
              ? "text-amber-400 font-medium"
              : isAccuseCorrect
                ? "text-green-400 font-medium"
                : isAccuseWrong
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
