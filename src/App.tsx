import { useState } from "react";
import { useGameState } from "./hooks/useGameState";
import { GameBoard } from "./components/GameBoard";
import { MysterySelect } from "./components/MysterySelect";

function LandingPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <h1
        className="fade-in mb-3 font-serif text-8xl tracking-[0.25em] text-[var(--text-primary)]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        MYSTERIUM
      </h1>
      <p
        className="fade-in mb-12 font-serif text-sm italic tracking-wide text-[var(--text-muted)]"
        style={{
          animationDelay: "0.2s",
          animationFillMode: "both",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        Some truths are buried. Others are waiting to be found.
      </p>

      <div className="noir-panel gold-border-left mb-10 w-full max-w-md p-6">
        <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
          <li className="flex items-start gap-2.5">
            <span className="mt-px text-[var(--accent-clue)]">◆</span>
            <span>Explore locations and examine evidence</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-px text-[var(--accent-clue)]">◆</span>
            <span>Talk to characters — they remember what you say</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-px text-[var(--accent-clue)]">◆</span>
            <span>Keep notes — nobody will do it for you</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-px text-[var(--accent-clue)]">◆</span>
            <span>Reconstruct the timeline when you&apos;re ready</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onStart}
        className="gold-glow rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all duration-300 hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)] hover:shadow-[0_0_20px_rgba(201,165,75,0.4)]"
      >
        Begin Investigation
      </button>

      <p
        className="fade-in mt-16 font-serif text-xs italic tracking-wider text-[var(--text-muted)]"
        style={{
          animationDelay: "0.6s",
          animationFillMode: "both",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        Every case is unique. Every detail matters. Trust no one.
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
    <div className="vignette flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] px-6">
      <h1
        className="fade-in mb-4 font-serif text-5xl tracking-[0.2em] text-[var(--text-primary)]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {title}
      </h1>
      <div className="mb-8 h-px w-24 bg-[var(--accent-clue)] opacity-60" />

      <div
        className="mb-10 w-full max-w-lg whitespace-pre-line text-sm leading-[1.8] text-[var(--text-secondary)]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {narrative}
      </div>

      <button
        onClick={onPlayAgain}
        className="gold-glow rounded border border-[var(--accent-clue)] bg-transparent px-8 py-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-clue)] transition-all duration-300 hover:bg-[var(--accent-clue)] hover:text-[var(--bg-primary)] hover:shadow-[0_0_20px_rgba(201,165,75,0.4)]"
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
