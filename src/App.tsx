import { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import { GameBoard } from "./components/GameBoard";
import { MysterySelect } from "./components/MysterySelect";

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <h1 className="fade-in mb-3 font-serif text-8xl tracking-[0.25em] text-[var(--text-primary)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        MYSTERIUM
      </h1>
      <p className="fade-in mb-12 text-sm tracking-wide text-[var(--text-muted)]" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        Some truths are buried. Others are waiting to be found.
      </p>

      <div className="noir-panel gold-border-left mb-10 w-full max-w-md p-6">
        <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
          <li>📍 Explore locations and examine evidence</li>
          <li>💬 Talk to characters — they remember what you say</li>
          <li>📓 Keep notes — nobody will do it for you</li>
          <li>🔍 Reconstruct the timeline when you&apos;re ready</li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all hover:shadow-[0_0_15px_rgba(201,165,75,0.3)] hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)]"
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
  const [selecting, setSelecting] = useState(false);

  const handlePlayAgain = () => {
    setSelecting(true);
  };

  const handleSelectMystery = (mysteryId: string) => {
    setSelecting(false);
    game.startGame(mysteryId);
  };

  if (game.gameState?.phase === "solved") {
    const lastTheory = game.gameState.theories[game.gameState.theories.length - 1];
    const narrative = lastTheory?.narrative ?? "The mystery is solved.";
    return (
      <EndScreen
        title="MYSTERY SOLVED"
        narrative={narrative}
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (game.gameState?.phase === "revealed") {
    return (
      <EndScreen
        title="CASE UNSOLVED"
        narrative="The truth slips through your fingers. Perhaps another detective will fare better."
        onPlayAgain={handlePlayAgain}
      />
    );
  }

  if (game.isPlaying) {
    return <GameBoard game={game} />;
  }

  if (selecting) {
    return <MysterySelect onSelect={handleSelectMystery} />;
  }

  return <LandingPage onStart={() => setSelecting(true)} />;
}
