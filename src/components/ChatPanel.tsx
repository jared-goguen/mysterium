/**
 * ChatPanel.tsx — NPC interrogation interface
 *
 * Displays a chat-style conversation with a suspect or witness.
 * Player messages appear right-aligned; NPC messages left-aligned.
 * Auto-scrolls to the latest message on new entries.
 */

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import type { Character } from "../../types/mystery";
import type { Conversation, NPCState } from "../../types/state";

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
    default:
      return "🤨";
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  character: Character;
  conversation: Conversation | undefined;
  npcState: NPCState | undefined;
  /** Text currently streaming from the NPC. Null when idle. */
  streamingText: string | null;
  /** Whether an API call is in flight. */
  loading: boolean;
  /** Player message shown optimistically before API confirms. */
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
  const cooperativeness = npcState?.cooperativeness ?? 50;
  const firstName = character.name.split(" ")[0] ?? character.name;
  const messages = conversation?.messages ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-neutral-900 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl" title={`Mood: ${emotion}`}>
            {moodEmoji(emotion)}
          </span>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              {character.name}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              {character.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Cooperativeness bar */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-[var(--text-muted)]">Cooperative</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-amber-600 transition-all"
                style={{ width: `${cooperativeness}%` }}
              />
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={onEndConversation}
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:bg-neutral-800 hover:text-[var(--text-primary)]"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm italic text-[var(--text-muted)]">
              {character.name} watches you warily. Ask your first question.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => {
              const isPlayer = msg.role === "player";
              return (
                <div
                  key={i}
                  className={`flex ${isPlayer ? "justify-end" : "justify-start"}`}
                >
                  {!isPlayer && (
                    <span className="mr-2 mt-1 shrink-0 text-xs font-medium text-[var(--text-muted)]">
                      {firstName}
                    </span>
                  )}
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                      isPlayer
                        ? "bg-blue-950 text-blue-100"
                        : "bg-neutral-800 text-[var(--text-primary)]"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {/* Optimistic player message — shown immediately on send */}
            {pendingMessage && (
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-lg bg-blue-950 px-3 py-2 text-sm leading-relaxed text-blue-100">
                  {pendingMessage}
                </div>
              </div>
            )}
            {/* Typing indicator — waiting for first NPC token */}
            {loading && streamingText !== null && !streamingText && (
              <div className="flex justify-start">
                <span className="mr-2 mt-1 shrink-0 text-xs font-medium text-[var(--text-muted)]">
                  {firstName}
                </span>
                <div className="max-w-[75%] rounded-lg bg-neutral-800 px-3 py-2 text-sm leading-relaxed">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            {/* Streaming response bubble — once tokens start flowing */}
            {streamingText ? (
              <div className="flex justify-start">
                <span className="mr-2 mt-1 shrink-0 text-xs font-medium text-[var(--text-muted)]">
                  {firstName}
                </span>
                <div className="max-w-[75%] rounded-lg bg-neutral-800 px-3 py-2 text-sm leading-relaxed text-[var(--text-primary)]">
                  {streamingText}
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--border-subtle)] bg-neutral-900 px-5 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${firstName} something...`}
            className="flex-1 rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-amber-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded bg-neutral-700 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">
          {character.speechPattern}
        </p>
      </div>
    </div>
  );
}
