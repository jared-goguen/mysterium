/**
 * MainPanel.tsx — View switcher based on current focus
 *
 * Renders LocationView when focused on a location,
 * ChatPanel when focused on a character.
 * Includes a context header showing current location/character name.
 */

import type { Mystery } from "../../types/mystery";
import type { Focus } from "../../types/state";

interface MainPanelProps {
  mystery: Mystery;
  focus: Focus;
}

export function MainPanel({ mystery, focus }: MainPanelProps) {
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

      {/* Content area — placeholder for LocationView / ChatPanel */}
      <div className="flex-1 overflow-y-auto p-5">
        {focus.type === "location" ? (
          <LocationPlaceholder
            locationId={focus.id}
            mystery={mystery}
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
 * Placeholder for LocationView — will be replaced by item-5.
 * Shows location description and examinables list.
 */
function LocationPlaceholder({
  locationId,
  mystery,
}: {
  locationId: string;
  mystery: Mystery;
}) {
  const location = mystery.locations.find((l) => l.id === locationId);
  if (!location) {
    return <p className="text-[var(--text-muted)]">Location not found.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-[var(--text-primary)]" style={{ fontFamily: "Georgia, serif" }}>
        {location.description}
      </p>

      {location.charactersPresent.length > 0 && (
        <div className="text-sm text-[var(--text-muted)]">
          <span className="text-xs uppercase tracking-wider">Present: </span>
          {location.charactersPresent
            .map((cid) => mystery.characters.find((c) => c.id === cid)?.name ?? cid)
            .join(", ")}
        </div>
      )}

      <div className="border-t border-[var(--border-subtle)] pt-4">
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
          Things to examine:
        </p>
        <ul className="mt-2 space-y-1">
          {location.examinables.map((ex) => (
            <li key={ex.id} className="text-sm text-[var(--text-muted)]">
              • {ex.name} — <span className="italic">{ex.surfaceDetail}</span>
            </li>
          ))}
        </ul>
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
