/**
 * SolutionModal.tsx — Timeline reconstruction form
 *
 * Shows known moments as context, gaps as text fields for the player
 * to fill in. After submission, shows per-moment scores and feedback.
 */

import { useState } from "react";
import type { ClientMystery, ClientClue } from "../../types/client";
import type { Theory } from "../../types/state";

interface SolutionModalProps {
  mystery: ClientMystery;
  discoveredClues: ClientClue[];
  loading: boolean;
  lastTheory: Theory | null;
  onSolve: (answers: Record<string, string>, evidenceCited: string[]) => void;
  onClose: () => void;
}

export function SolutionModal({
  mystery,
  discoveredClues,
  loading,
  lastTheory,
  onSolve,
  onClose,
}: SolutionModalProps) {
  const gaps = mystery.solution.moments.filter((m) => !m.isKnown);
  const known = mystery.solution.moments.filter((m) => m.isKnown);

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(gaps.map((g) => [g.id, ""])),
  );
  const [selectedClues, setSelectedClues] = useState<Set<string>>(new Set());

  const filledGaps = gaps.filter((g) => answers[g.id]?.trim());
  const canSubmit = filledGaps.length > 0 && !loading && !lastTheory;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSolve(answers, [...selectedClues]);
  };

  const toggleClue = (id: string) => {
    setSelectedClues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const outcomeBadge = lastTheory
    ? {
        solved: { text: "CASE CLOSED", style: "bg-green-900/60 text-green-300 border border-green-700/50" },
        close: { text: "PARTIAL DEDUCTION", style: "bg-amber-900/60 text-amber-300 border border-amber-700/50" },
        wrong: { text: "DEAD END", style: "bg-red-900/60 text-red-300 border border-red-700/50" },
      }[lastTheory.outcome]
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.95) 100%)",
      }}
    >
      <div className="fade-in max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-warm)] bg-[var(--bg-panel)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-warm)] px-6 py-4">
          <h2 className="noir-header text-base text-[var(--text-primary)]">
            Reconstruct the Timeline
          </h2>
          {!lastTheory?.gameOver && (
            <button
              onClick={onClose}
              className="text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result display */}
        {lastTheory ? (
          <div className="px-6 py-6">
            <div className="fade-in mb-4 flex items-center gap-3">
              <span
                className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-widest ${outcomeBadge?.style}`}
              >
                {outcomeBadge?.text}
              </span>
              <span className="fade-in font-mono text-sm text-[var(--text-muted)]">
                Score: {Math.round(lastTheory.score * 100)}%
              </span>
            </div>

            {/* Per-moment results */}
            <div className="mb-4 space-y-2">
              {lastTheory.momentResults.map((mr) => {
                const moment = mystery.solution.moments.find((m) => m.id === mr.momentId);
                const scoreColor =
                  mr.score >= 0.7
                    ? "text-[var(--accent-clue)]"
                    : mr.score >= 0.4
                      ? "text-amber-400"
                      : "text-[var(--accent-danger)]";
                const scoreIcon = mr.score >= 0.7 ? "✅" : mr.score >= 0.4 ? "🟡" : "❌";
                return (
                  <div
                    key={mr.momentId}
                    className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span>{scoreIcon}</span>
                      <span className="font-mono text-[var(--text-muted)]">{moment?.time}</span>
                      <span className={`font-semibold ${scoreColor}`}>
                        {Math.round(mr.score * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-primary)]">
                      {mr.feedback}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Narrative */}
            <div className="narrative mb-6 whitespace-pre-line text-[var(--text-primary)]">
              {lastTheory.narrative}
            </div>

            {lastTheory.gameOver ? (
              <button
                onClick={onClose}
                className="fade-in w-full rounded border border-green-700/50 bg-green-900/40 px-4 py-3 text-sm font-semibold uppercase tracking-wider text-green-300 transition-colors hover:bg-green-900/60"
              >
                Mystery Solved
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full rounded border border-[var(--border-warm)] bg-[var(--bg-surface)] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:bg-neutral-800"
              >
                Continue Investigating
              </button>
            )}
          </div>
        ) : (
          /* Timeline reconstruction form */
          <div className="px-6 py-5">
            <p className="mb-5 text-xs text-[var(--text-muted)]">
              Fill in the gaps in the timeline. Known events are shown for context.
            </p>

            {/* Timeline — vertical line container */}
            <div className="relative mb-5 space-y-3 pl-6">
              {/* Vertical connecting line */}
              <div
                className="absolute left-[7px] top-2 bottom-2 w-[2px]"
                style={{ background: "var(--border-warm)" }}
              />

              {mystery.solution.moments.map((moment) => (
                <div key={moment.id} className="relative">
                  {moment.isKnown ? (
                    /* Known moment — read-only context */
                    <div className="gold-border-left rounded-r bg-[var(--bg-surface)] px-3 py-2">
                      {/* Gold dot on timeline */}
                      <div
                        className="absolute -left-[19px] top-3 h-3 w-3 rounded-full border-2 border-[var(--accent-clue)]"
                        style={{ background: "var(--accent-clue)" }}
                      />
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">
                          {moment.time}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {moment.knownDescription}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Gap — player fills in */
                    <div className="rounded border border-[var(--border-warm)] bg-[var(--bg-surface)] px-3 py-3">
                      {/* Open circle on timeline */}
                      <div
                        className="absolute -left-[19px] top-3 h-3 w-3 rounded-full border-2 border-[var(--accent-clue)]"
                        style={{ background: "var(--bg-panel)" }}
                      />
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-[var(--accent-clue)]">
                          {moment.time}
                        </span>
                        <span className="text-xs text-[var(--text-primary)]">
                          {moment.prompt}
                        </span>
                      </div>
                      <textarea
                        value={answers[moment.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [moment.id]: e.target.value }))
                        }
                        placeholder="What happened here?"
                        rows={2}
                        className="ruled-lines w-full rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-amber-700"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Evidence */}
            {discoveredClues.length > 0 && (
              <div className="mb-5">
                <label className="noir-header mb-2 block text-[var(--accent-clue)]">
                  Cite Your Evidence
                </label>
                <div className="space-y-1">
                  {discoveredClues.map((clue) => (
                    <label
                      key={clue.id}
                      className="flex cursor-pointer items-start gap-2 rounded border border-transparent px-2 py-1.5 transition-colors hover:border-[var(--border-warm)] hover:bg-[var(--bg-surface)]"
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
                  ? "bg-[var(--accent-clue)] text-[var(--bg-primary)] hover:opacity-90"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-600"
              } ${loading ? "animate-pulse" : ""}`}
            >
              {loading ? "Evaluating..." : "Present Your Solution"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
