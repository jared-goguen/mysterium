/**
 * NotesPanel.tsx — Detective's personal case notes
 *
 * A collapsible bottom strip for the player to record observations,
 * suspicions, and theories. Feels like a physical notebook page.
 */

import { useState } from "react";

interface NotesPanelProps {
  notes: string;
  onUpdateNotes: (text: string) => void;
}

export function NotesPanel({ notes, onUpdateNotes }: NotesPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const wordCount = notes.split(/\s+/).filter(Boolean).length;

  return (
    <div className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      {/* Always-visible header bar */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-2"
        onClick={() => setCollapsed((c) => !c)}
      >
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] small-caps">
          📓 Detective&apos;s Notes
        </h3>
        <div className="flex items-center gap-3">
          {notes.length > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">
              {wordCount} word{wordCount === 1 ? "" : "s"}
            </span>
          )}
          <span
            className="text-[var(--text-muted)] transition-transform duration-300"
            style={{ display: "inline-block", transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
          >
            {collapsed ? "▸" : "▾"}
          </span>
        </div>
      </div>

      {/* Collapsible textarea area — CSS grid row transition */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: collapsed ? "0fr" : "1fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1">
            <textarea
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Record your observations, suspicions, and theories..."
              className="ruled-lines h-[140px] w-full resize-none rounded bg-[var(--bg-input)] p-3 font-mono text-sm text-[var(--text-primary)] placeholder-neutral-600 outline-none focus:ring-1 focus:ring-neutral-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
