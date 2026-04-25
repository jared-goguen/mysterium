/**
 * AccusationModal.tsx — Present your case
 *
 * Single-form overlay: select suspect, state motive + method,
 * cite evidence, submit. Shows the AI-generated result inline.
 */

import { useState } from "react";
import type { Character, Clue } from "../../types/mystery";
import type { AccusationOutcome } from "../../types/state";

interface AccusationModalProps {
  characters: Character[];
  discoveredClues: Clue[];
  loading: boolean;
  onAccuse: (
    suspectId: string,
    motive: string,
    method: string,
    evidenceCited: string[],
  ) => void;
  onClose: () => void;
  /** Set externally after the accuse call resolves. */
  lastResult: {
    outcome: AccusationOutcome;
    narrative: string;
    gameOver: boolean;
  } | null;
}

export function AccusationModal({
  characters,
  discoveredClues,
  loading,
  onAccuse,
  onClose,
  lastResult,
}: AccusationModalProps) {
  const [suspectId, setSuspectId] = useState<string | null>(null);
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [selectedClues, setSelectedClues] = useState<Set<string>>(new Set());

  const canSubmit =
    suspectId && motive.trim() && method.trim() && !loading && !lastResult;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAccuse(suspectId, motive.trim(), method.trim(), [...selectedClues]);
  };

  const toggleClue = (id: string) => {
    setSelectedClues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const outcomeBadge = lastResult
    ? {
        correct: { text: "Case Solved", style: "bg-green-900/60 text-green-300" },
        partial: { text: "Partially Correct", style: "bg-amber-900/60 text-amber-300" },
        wrong: { text: "Wrong", style: "bg-red-900/60 text-red-300" },
      }[lastResult.outcome]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="text-lg font-semibold tracking-wide text-[var(--text-primary)]">
            ⚖️ Make Your Accusation
          </h2>
          {!lastResult?.gameOver && (
            <button
              onClick={onClose}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result display (replaces form when result arrives) */}
        {lastResult ? (
          <div className="px-6 py-6">
            {/* Outcome badge */}
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider ${outcomeBadge?.style}`}
              >
                {outcomeBadge?.text}
              </span>
              {lastResult.outcome === "correct" && (
                <span className="text-sm text-green-400">
                  The case is closed.
                </span>
              )}
            </div>

            {/* Narrative */}
            <div className="mb-6 whitespace-pre-line text-sm leading-relaxed text-[var(--text-primary)]">
              {lastResult.narrative}
            </div>

            {/* Action button */}
            {lastResult.gameOver ? (
              <button
                onClick={onClose}
                className="w-full rounded bg-green-800 px-4 py-3 text-sm font-semibold text-green-100 transition-colors hover:bg-green-700"
              >
                Case Closed
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full rounded bg-neutral-700 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-neutral-600"
              >
                Continue Investigating
              </button>
            )}
          </div>
        ) : (
          /* Accusation form */
          <div className="px-6 py-5 space-y-5">
            {/* Suspect selection */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Who did it?
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSuspectId(c.id)}
                    className={`rounded border px-3 py-2 text-left text-sm transition-colors ${
                      suspectId === c.id
                        ? "border-[var(--accent-danger)] bg-red-950/40 text-[var(--text-primary)]"
                        : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-neutral-600 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      {c.description.split(".")[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Motive */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Why did they do it?
              </label>
              <textarea
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                placeholder="State the motive..."
                rows={2}
                className="w-full rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-amber-700"
              />
            </div>

            {/* Method */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                How did they do it?
              </label>
              <textarea
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Describe the method..."
                rows={2}
                className="w-full rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-amber-700"
              />
            </div>

            {/* Evidence */}
            {discoveredClues.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Cite your evidence
                </label>
                <div className="space-y-1.5">
                  {discoveredClues.map((clue) => (
                    <label
                      key={clue.id}
                      className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClues.has(clue.id)}
                        onChange={() => toggleClue(clue.id)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span className="text-xs leading-relaxed text-[var(--text-primary)]">
                        {clue.description.length > 120
                          ? clue.description.slice(0, 117) + "..."
                          : clue.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full rounded px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                canSubmit
                  ? "bg-[var(--accent-danger)] text-white hover:bg-red-600"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-600"
              }`}
            >
              {loading ? "Presenting case..." : "Present Your Case"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
