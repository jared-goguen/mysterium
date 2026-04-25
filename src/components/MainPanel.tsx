/**
 * MainPanel.tsx — View switcher based on current focus
 *
 * Renders LocationView when focused on a location,
 * ChatPanel when focused on a character.
 * Includes a context header showing current location/character name.
 */

import type { Mystery, Clue } from "../../types/mystery";
import type { Focus, Exploration } from "../../types/state";
import { LocationView } from "./LocationView";

interface MainPanelProps {
  mystery: Mystery;
  focus: Focus;
  explorations: Exploration[];
  discoveredClues: Clue[];
  onExamine: (query: string) => void;
  onTalkTo: (characterId: string) => void;
}

export function MainPanel({ mystery, focus, explorations, discoveredClues, onExamine, onTalkTo }: MainPanelProps) {
  const contextName =
    focus.type === "location"
      ? mystery.locations.find((l) => l.id === focus.id)?.name ?? "Unknown Location"
      : mystery.characters.find((c) => c.id === focus.id)?.name ?? "Unknown Character";

  const contextIcon = focus.type === "location" ? "📍" : "💬";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Context header */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-5 py-3">
        <span className="text-sm">{contextIcon}</span>
        <h2 className="text-sm font-medium tracking-wide text-[var(--text-primary)]">
          {contextName}
        </h2>
        <span className="text-xs text-[var(--text-muted)]">
          {focus.type === "location" ? "Location" : "Interrogation"}
        </span>
      </div>

      {/* Content area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {focus.type === "location" ? (
          <LocationView
            location={mystery.locations.find((l) => l.id === focus.id)!}
            discoveredClues={discoveredClues}
            examineHistory={explorations
              .filter((e) => e.locationId === focus.id && !e.query.startsWith("Moved to "))
              .map((e) => ({
                query: e.query,
                narrative: e.narrative,
                clueFound: e.clueFound,
              }))}
            charactersPresent={mystery.locations
              .find((l) => l.id === focus.id)
              ?.charactersPresent.map((cid) => ({
                id: cid,
                name: mystery.characters.find((c) => c.id === cid)?.name ?? cid,
              })) ?? []}
            onExamine={onExamine}
            onTalkTo={onTalkTo}
          />
        ) : (
          <CharacterPlaceholder
            characterId={focus.id}
            mystery={mystery}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder for ChatPanel — will be replaced by item-6.
 * Shows character description and personality.
 */
function CharacterPlaceholder({
  characterId,
  mystery,
}: {
  characterId: string;
  mystery: Mystery;
}) {
  const character = mystery.characters.find((c) => c.id === characterId);
  if (!character) {
    return <p className="text-[var(--text-muted)]">Character not found.</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-primary)]">{character.description}</p>
      <p className="text-sm italic text-[var(--text-muted)]">
        {character.personality}
      </p>
      <p className="text-xs text-[var(--text-muted)]">
        Speech: {character.speechPattern}
      </p>
    </div>
  );
}
