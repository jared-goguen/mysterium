/**
 * NarrativeText.tsx — Rich text renderer for AI narrative output
 *
 * Parses the conventions Sonnet uses in NPC dialogue and examination narratives:
 *   *text in asterisks*  → stage directions (italic, muted)
 *   regular text         → spoken dialogue / narration (primary, serif)
 *   \n\n                 → paragraph break (visual beat)
 *
 * Handles edge cases:
 *   - Mixed action + dialogue in one paragraph
 *   - Streaming text cut off mid-*action
 *   - Empty paragraphs collapsed
 *   - Preserves em dashes and ellipses
 */

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Segment types
// ---------------------------------------------------------------------------

interface Segment {
  type: "action" | "dialogue";
  text: string;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse a paragraph into alternating dialogue/action segments.
 *
 * Splits on *...* patterns. Text outside asterisks is dialogue,
 * text inside is action (stage directions).
 *
 * Handles unclosed asterisks gracefully (streaming mid-action):
 * treats the trailing text as action if it starts with *.
 */
function parseSegments(paragraph: string): Segment[] {
  const segments: Segment[] = [];
  // Match *...* groups, or a trailing *unclosed at end of string
  const pattern = /\*([^*]+)\*|\*([^*]*)$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(paragraph)) !== null) {
    // Dialogue text before this action
    if (match.index > lastIndex) {
      const text = paragraph.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "dialogue", text });
    }

    // Action text (closed *...* or unclosed trailing *...)
    const actionText = (match[1] ?? match[2] ?? "").trim();
    if (actionText) segments.push({ type: "action", text: actionText });

    lastIndex = match.index + match[0].length;
  }

  // Remaining dialogue after last action
  if (lastIndex < paragraph.length) {
    const text = paragraph.slice(lastIndex).trim();
    if (text) segments.push({ type: "dialogue", text });
  }

  return segments;
}

/**
 * Parse raw text into paragraphs of segments.
 * Splits on double newlines. Filters empty paragraphs.
 */
function parseNarrative(text: string): Segment[][] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(parseSegments)
    .filter((segs) => segs.length > 0);
}

// ---------------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------------

function renderSegment(seg: Segment, key: number): ReactNode {
  if (seg.type === "action") {
    return (
      <span key={key} className="narrative-action">
        {seg.text}
      </span>
    );
  }
  return (
    <span key={key} className="narrative-dialogue">
      {seg.text}
    </span>
  );
}

function renderParagraph(segments: Segment[], key: number): ReactNode {
  // If the entire paragraph is a single action, render as its own block
  if (segments.length === 1 && segments[0]!.type === "action") {
    return (
      <p key={key} className="narrative-action-block">
        {segments[0]!.text}
      </p>
    );
  }

  return (
    <p key={key} className="narrative-paragraph">
      {segments.map((seg, i) => renderSegment(seg, i))}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface NarrativeTextProps {
  /** Raw text from AI (NPC response or examination narrative). */
  text: string;
  /** Additional CSS class for the container. */
  className?: string;
}

export function NarrativeText({ text, className }: NarrativeTextProps) {
  if (!text) return null;

  const paragraphs = parseNarrative(text);

  return (
    <div className={`narrative ${className ?? ""}`}>
      {paragraphs.map((segs, i) => renderParagraph(segs, i))}
    </div>
  );
}
