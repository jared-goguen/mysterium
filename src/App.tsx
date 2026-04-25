import { useGameState } from "./hooks/useGameState";
import { GameBoard } from "./components/GameBoard";

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      {/* Title */}
      <h1 className="mb-2 font-serif text-6xl tracking-widest text-[var(--text-primary)]">
        MYSTERIUM
      </h1>
      <p className="mb-10 text-sm tracking-wide text-[var(--text-muted)]">
        An interactive mystery investigation
      </p>

      {/* Case file card */}
      <div className="mb-10 w-full max-w-md rounded border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent-clue)]">
          Case Briefing
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-primary)]">
          A body has been discovered at The Blue Parrot, a smoky jazz club on the
          wrong side of town. The victim: club owner{" "}
          <span className="font-medium text-[var(--accent-clue)]">Frankie Delacroix</span>.
          Four suspects. One truth. No second chances.
        </p>
        <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>📍 Explore locations and examine evidence</li>
          <li>💬 Interrogate suspects — they lie, deflect, and remember</li>
          <li>📓 Keep notes — nobody will do it for you</li>
          <li>⚖️ Make your accusation when you&apos;re ready</li>
        </ul>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)]"
      >
        Begin Investigation
      </button>

      {/* Footer */}
      <p className="mt-12 text-[10px] text-[var(--text-muted)]">
        Prototype — Blue Parrot scenario with mock AI responses
      </p>
    </div>
  );
}

export function App() {
  const game = useGameState();

  if (!game.isPlaying) {
    return <LandingPage onStart={game.startGame} />;
  }

  return <GameBoard game={game} />;
}
