import { useGameState } from "./hooks/useGameState";
import { GameBoard } from "./components/GameBoard";

function LandingPage({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      {/* Title */}
      <h1 className="mb-2 font-serif text-6xl tracking-widest text-[var(--text-primary)]">
        MYSTERIUM
      </h1>
      <p className="mb-10 text-sm tracking-wide text-[var(--text-muted)]">
        An AI-powered interactive mystery investigation
      </p>

      {/* Case file card */}
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

  // Solved — player correctly accused the culprit
  if (game.gameState?.phase === "solved") {
    const lastAccusation =
      game.gameState.accusations[game.gameState.accusations.length - 1];
    const narrative =
      lastAccusation?.consequence.narrative ?? "The case is closed.";
    return (
      <EndScreen
        title="CASE SOLVED"
        narrative={narrative}
        onPlayAgain={game.startGame}
      />
    );
  }

  // Revealed — player gave up
  if (game.gameState?.phase === "revealed") {
    // The give-up narrative would be in the last accusation or stored elsewhere.
    // For now, show a simple message. The give-up API route returns a narrative
    // but we'd need to store it. TODO: store giveUp result in state.
    return (
      <EndScreen
        title="CASE UNSOLVED"
        narrative="The truth slips through your fingers. Perhaps another detective will fare better."
        onPlayAgain={game.startGame}
      />
    );
  }

  // Playing
  if (game.isPlaying) {
    return <GameBoard game={game} />;
  }

  // Not started
  return <LandingPage onStart={game.startGame} />;
}
