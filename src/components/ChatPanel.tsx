/**
 * ChatPanel.tsx — NPC interrogation interface
 *
 * Two distinct message styles:
 *   Player: right-aligned compact bubbles
 *   NPC: full-width narrative blocks with rich text rendering
 *        (stage directions in italic, paragraph breaks as beats)
 *
 * Auto-scrolls to the latest message. Supports streaming text.
 */

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import type { ClientCharacter } from "../../types/client";
import type { Conversation, NPCState } from "../../types/state";
import { NarrativeText } from "./NarrativeText";

// ---------------------------------------------------------------------------
// Mood indicator
// ---------------------------------------------------------------------------

function moodEmoji(emotion: string): string {
  switch (emotion.toLowerCase()) {
    case "nervous":
      return "😰";
    case "calm":
      return "😌";
    case "hostile":
      return "😤";
    case "scared":
      return "😨";
    case "anxious":
      return "😟";
    case "defeated":
      return "😔";
    case "relieved":
      return "😮‍💨";
    default:
      return "🤨";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  character: ClientCharacter;
  conversation: Conversation | undefined;
  npcState: NPCState | undefined;
  /** Text currently streaming from the NPC. Null when idle. */
  streamingText: string | null;
  /** Whether an API call is in flight. */
  loading: boolean;
  /** Player message sent but not yet in conversation history (shown optimistically). */
  pendingMessage: string | null;
  onSendMessage: (message: string) => void;
  onEndConversation: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPanel({
  character,
  conversation,
  npcState,
  streamingText,
  loading,
  pendingMessage,
  onSendMessage,
  onEndConversation,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or streaming text change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamingText]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emotion = npcState?.emotion ?? "unknown";
  const rapport = npcState?.rapport ?? 40;
  const firstName = character.name.split(" ")[0] ?? character.name;
  const messages = conversation?.messages ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-semibold tracking-wide text-[var(--text-primary)]" style={{ fontFamily: "Georgia, serif", fontSize: "1.05rem" }}>
              {character.name}
            </h3>
            <p className="text-xs italic text-[var(--text-muted)]">
              {moodEmoji(emotion) ? `*${emotion}*` : `*${emotion}*`}
            </p>
            <p className="text-xs text-[var(--text-muted)] opacity-70">
              {character.personality}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Rapport bar */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-[var(--text-muted)]">Rapport</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${rapport}%`, background: `linear-gradient(to right, transparent, var(--accent-clue))` }}
              />
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={onEndConversation}
            disabled={loading}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--border-warm)] hover:text-[var(--accent-clue)] disabled:opacity-40"
          >
            ← Walk away
          </button>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && streamingText === null ? (
          <div className="flex h-full items-center justify-center">
            <p className="fade-in max-w-sm text-center italic text-[var(--text-muted)]" style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", lineHeight: "1.7" }}>
              {character.name} watches you warily. The silence stretches between you like a taut wire. Ask your first question.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isPlayer = msg.role === "player";

              if (isPlayer) {
                // Player: right-aligned warm muted bubble
                return (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[70%] rounded-lg bg-stone-900/80 px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // NPC: full-width narrative block with warm left border
              return (
                <div key={i} className="npc-message border-l-[3px] border-[var(--accent-clue)]/30 pl-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="noir-header text-xs text-[var(--text-muted)]">
                      {firstName}
                    </span>
                    <div className="h-px flex-1 bg-[var(--border-warm)]" />
                  </div>
                  <div className="pl-1">
                    <NarrativeText text={msg.content} />
                  </div>
                </div>
              );
            })}

            {/* Pending player message (sent but not yet in history) */}
            {pendingMessage && (
              <div className="flex justify-end">
                <div className="max-w-[70%] rounded-lg bg-stone-900/80 px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]">
                  {pendingMessage}
                </div>
              </div>
            )}

            {/* Streaming response */}
            {streamingText !== null && (
              <div className="npc-message border-l-[3px] border-[var(--accent-clue)]/30 pl-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="noir-header text-xs text-[var(--text-muted)]">
                    {firstName}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border-warm)]" />
                </div>
                <div className="pl-1">
                  {streamingText ? (
                    <NarrativeText text={streamingText} />
                  ) : (
                    <p className="narrative animate-pulse text-[var(--accent-clue)]">…</p>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${firstName} something...`}
            className="flex-1 rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-[var(--accent-clue)]/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded bg-[var(--bg-surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--border-warm)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs italic text-[var(--text-muted)]" style={{ fontFamily: "Georgia, serif" }}>
          {character.speechPattern}
        </p>
      </div>
    </div>
  );
}
