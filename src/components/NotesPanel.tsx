/**
 * NotesPanel.tsx — Detective's personal case notes
 *
 * A simple but essential panel for the player to record observations,
 * suspicions, and theories. Feels like a physical notebook page.
 */

interface NotesPanelProps {
  notes: string;
  onUpdateNotes: (text: string) => void;
}

export function NotesPanel({ notes, onUpdateNotes }: NotesPanelProps) {
  const wordCount = notes.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          📓 Detective&apos;s Notes
        </h3>
      </div>

      {/* Textarea fills remaining space */}
      <div className="flex flex-1 flex-col p-3">
        <textarea
          value={notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Record your observations, suspicions, and theories..."
          className="flex-1 resize-none rounded bg-[var(--bg-input)] p-3 font-mono text-sm text-[var(--text-primary)] placeholder-neutral-600 outline-none focus:ring-1 focus:ring-neutral-700"
        />

        {/* Word count */}
        <div className="mt-2 text-right text-[10px] text-[var(--text-muted)]">
          {notes.length > 0 ? `${wordCount} word${wordCount === 1 ? "" : "s"}` : ""}
        </div>
      </div>
    </div>
  );
}
