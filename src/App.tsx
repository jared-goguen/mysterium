import { useGameState } from "./hooks/useGameState";
import { GameBoard } from "./components/GameBoard";

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <h1 className="mb-2 font-serif text-6xl tracking-widest text-[var(--text-primary)]">
        MYSTERIUM
      </h1>
      <p className="mb-10 text-sm tracking-wide text-[var(--text-muted)]">
        An AI-powered interactive mystery investigation
      </p>

      <div className="mb-10 w-full max-w-md rounded border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--accent-clue)]">
          Case Briefing
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-primary)]">
          A body has been discovered at The Blue Parrot, a smoky jazz club in
          1947 Los Angeles. The victim: club owner{" "}
          <span className="font-medium text-[var(--accent-clue)]">
            Victor Morel
          </span>
          . Cyanide in his whiskey. Five suspects, each hiding something. One truth.
        </p>
        <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>📍 Explore locations and examine evidence</li>
          <li>💬 Interrogate suspects — they lie, deflect, and remember</li>
          <li>📓 Keep notes — nobody will do it for you</li>
          <li>🔍 Reconstruct the timeline when you&apos;re ready</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)]"
      >
        Begin Investigation
      </button>

      <p className="mt-12 text-[10px] text-[var(--text-muted)]">
        Every mystery is unique. No spoilers possible.
      </p>
    </div>
  );
}

function EndScreen({
  title,
  narrative,
  onPlayAgain,
}: {
  title: string;
  narrative: string;
  onPlayAgain: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <h1 className="mb-2 font-serif text-4xl tracking-widest text-[var(--text-primary)]">
        {title}
      </h1>
      <div className="mb-8 h-px w-24 bg-[var(--border-subtle)]" />

      <div className="mb-10 w-full max-w-lg whitespace-pre-line text-sm leading-relaxed text-[var(--text-primary)]">
        {narrative}
      </div>

      <button
        onClick={onPlayAgain}
        className="rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)]"
      >
        New Investigation
      </button>
    </div>
  );
}

export function App() {
  const game = useGameState();

  if (game.gameState?.phase === "solved") {
    const lastTheory = game.gameState.theories[game.gameState.theories.length - 1];
    const narrative = lastTheory?.narrative ?? "The mystery is solved.";
    return (
      <EndScreen
        title="MYSTERY SOLVED"
        narrative={narrative}
        onPlayAgain={game.startGame}
      />
    );
  }

  if (game.gameState?.phase === "revealed") {
    return (
      <EndScreen
        title="CASE UNSOLVED"
        narrative="The truth slips through your fingers. Perhaps another detective will fare better."
        onPlayAgain={game.startGame}
      />
    );
  }

  if (game.isPlaying) {
    return <GameBoard game={game} />;
  }

  return <LandingPage onStart={game.startGame} />;
}
