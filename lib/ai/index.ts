// Client
export { createClient, streamChat, callTool, MODELS } from "./client";
export type { ModelTier, MessageParam } from "./client";

// Tools
export {
  EXAMINE_TOOL,
  DETECT_CLUES_TOOL,
  SUMMARIZE_TOOL,
  EVALUATE_SOLUTION_TOOL,
  GIVE_UP_TOOL,
} from "./tools";

// Context builders
export {
  locationContext,
  characterContext,
  conversationContext,
  solutionContext,
} from "./context";
export type {
  LocationContext,
  CharacterContext,
  ConversationContext,
  SolutionContext,
} from "./context";

// Engines
export { examine } from "./engines/examiner";
export { converse } from "./engines/conversant";
export { summarize } from "./engines/summarizer";
export { evaluate, giveUp } from "./engines/judge";
