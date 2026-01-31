/**
 * AI prompt templates for OpenAI generation.
 * Single source of truth for all system/user messages used in lib/ai/openai.ts.
 */

/** Appended to prompts to avoid em-dashes in model output. */
export const NO_EM_DASH =
  " Do not use em-dashes (—) in your response; use hyphens (-) or rephrase.";

// ---------------------------------------------------------------------------
// Project summary
// ---------------------------------------------------------------------------

export const PROJECT_SUMMARY = {
  system:
    "Summarize this short-form video script in one sentence: what did the creator say, promise, or set up for later? Return only that sentence, no quotes or labels." +
    NO_EM_DASH,
} as const;

// ---------------------------------------------------------------------------
// Ideas generation
// ---------------------------------------------------------------------------

export const IDEAS = {
  system:
    "You are a creative content strategist for short-form video (TikTok, Instagram Reels, YouTube Shorts). Given the channel context, suggest specific, actionable content ideas. Return only a JSON object with key \"ideas\" whose value is an array of strings, each string one idea (1-2 sentences). Example: { \"ideas\": [\"Idea one...\", \"Idea two...\"] }" +
    NO_EM_DASH,
  userWithRoughIdea: (channelContext: string, roughIdea: string, count: number) =>
    `Channel context:\n${channelContext}\n\nRough idea from the creator:\n"${roughIdea}"\n\nTurn this rough idea into ${count} concrete, actionable content idea(s) (1-2 sentences each). Keep the creator's intent but make each idea specific and ready to film. Return JSON: { "ideas": ["...", "..."] }`,
  userWithoutRoughIdea: (channelContext: string, focusBucket: string | null, count: number) => {
    const bucketLine = focusBucket
      ? `\nFocus ideas only on this content bucket: "${focusBucket}".\n`
      : "";
    return `Channel context:\n${channelContext}${bucketLine}\nGenerate ${count} content ideas. Return JSON: { "ideas": ["...", "..."] }`;
  },
} as const;

// ---------------------------------------------------------------------------
// Brainstorm sub-ideas
// ---------------------------------------------------------------------------

export const BRAINSTORM_SUB_IDEAS = {
  system:
    "You are a creative content strategist for short-form video. Given a main idea, suggest concrete sub-ideas or parts (angles, beats, sections) that could be explored. Return only a JSON object with key \"ideas\" whose value is an array of strings, each 1-2 sentences. Example: { \"ideas\": [\"Part one...\", \"Part two...\"] }" +
    NO_EM_DASH,
  user: (channelContext: string, parentIdeaContent: string, count: number) =>
    `Channel context:\n${channelContext}\n\nMain idea:\n${parentIdeaContent}\n\nSuggest ${count} sub-ideas or parts for this idea. Return JSON: { "ideas": ["...", "..."] }`,
} as const;

// ---------------------------------------------------------------------------
// Brainstorm / refine note (single card)
// ---------------------------------------------------------------------------

export const BRAINSTORM_NOTE = {
  systemEmpty:
    `You are a creative content strategist for short-form video. The creator has an empty or minimal idea card. Based on the channel context below, suggest ONE concrete content idea (1-2 sentences) they could use for a video. Return only that idea text - no labels, quotes, or meta-commentary.${NO_EM_DASH}`,
  systemRefine: (channelContext: string, instruction: string) =>
    `You are a creative content strategist. Channel context:\n${channelContext}\n\n${instruction} Return only the refined text, no labels or quotes.${NO_EM_DASH}`,
  userEmpty: (channelContext: string) =>
    `Channel context:\n${channelContext}\n\nGenerate one concrete content idea for this card.`,
} as const;

// ---------------------------------------------------------------------------
// Goals and buckets (channel setup)
// ---------------------------------------------------------------------------

export const GOALS_AND_BUCKETS = {
  system: "You are a content strategist. Return only valid JSON, no markdown." + NO_EM_DASH,
  userGoals: (channelName: string, coreAudience: string | null, currentGoals: string | null) =>
    `Channel: ${channelName}. Audience: ${coreAudience ?? "not set"}. Current goals: ${currentGoals ?? "none"}. Suggest improved or expanded goals (2-4 sentences). Return JSON: { "goals": "..." }`,
  userBuckets: (channelName: string, currentBuckets: { name: string; description: string | null }[]) =>
    `Channel: ${channelName}. Current buckets: ${JSON.stringify(currentBuckets)}. Suggest 3-6 content buckets (themes) with short descriptions. Return JSON: { "buckets": [ { "name": "...", "description": "..." } ] }`,
  userBoth: (
    channelName: string,
    coreAudience: string | null,
    currentGoals: string | null,
    currentBuckets: { name: string; description: string | null }[]
  ) =>
    `Channel: ${channelName}. Audience: ${coreAudience ?? "not set"}. Current goals: ${currentGoals ?? "none"}. Current buckets: ${JSON.stringify(currentBuckets)}. Suggest goals (2-4 sentences) and 3-6 content buckets with descriptions. Return JSON: { "goals": "...", "buckets": [ { "name": "...", "description": "..." } ] }`,
} as const;

// ---------------------------------------------------------------------------
// Content output (title, description, hashtags, script, hooks)
// ---------------------------------------------------------------------------

export type ContentOutputType = "title" | "description" | "hashtags" | "script" | "hooks";

export const CONTENT_OUTPUT = {
  /** Hook inspiration block when type is hooks. */
  hookInspirationBlock: (hooks: string[]) =>
    `Use these proven hooks as inspiration (adapt to this idea, don't copy):\n${hooks.slice(0, 15).join("\n")}\n\n`,

  /** Opening hook block when type is script and openingHook is provided. */
  scriptHookBlock: (openingHook: string) =>
    `Use this as the opening hook (first 1-2 sentences of the script):\n"${openingHook.trim()}"\n\n`,

  /** Additional context block from "idea for this" blocks. */
  additionalContextBlock: (additionalContext: string) =>
    `Additional ideas/context from the creator:\n${additionalContext.trim()}\n\n`,

  typeInstructions: (
    type: ContentOutputType,
    options: { openingHook?: string }
  ): string => {
    const base: Record<ContentOutputType, string> = {
      title:
        "Generate a single catchy title for this idea (one line). Return only the title text, no quotes or labels.",
      description:
        "Generate a short platform description (2-4 sentences) for this idea. Return only the description.",
      hashtags:
        "Generate 5-10 relevant hashtags for TikTok/Instagram/YouTube. Return only the hashtags, comma-separated or one per line.",
      script:
        "Generate a short script for a 30-60 second video. Split it into three parts: hook (opening 1-2 sentences), body (main content), end (closing/CTA). " +
        (options.openingHook?.trim() ? "Use the given opening hook as the hook. " : "") +
        'Return valid JSON only, with exactly these keys: "hook", "body", "end". Example: { "hook": "...", "body": "...", "end": "..." }. Every key must be a non-empty string.',
      hooks:
        "Generate 3-5 opening hooks (first 1-2 sentences to grab attention) for this idea. Return JSON: { \"hooks\": [\"hook1\", \"hook2\", ...] }",
    };
    return base[type];
  },

  /** Build full system message for content output. */
  systemContent: (
    channelContext: string,
    type: ContentOutputType,
    parts: {
      hookPart?: string;
      scriptHookPart?: string;
      additionalPart?: string;
      openingHook?: string;
    }
  ) => {
    const typeInstr = CONTENT_OUTPUT.typeInstructions(type, {
      openingHook: parts.openingHook,
    });
    const hookPart = parts.hookPart ?? "";
    const scriptHookPart = parts.scriptHookPart ?? "";
    const additionalPart = parts.additionalPart ?? "";
    return `You are a short-form video copywriter. Channel context:\n${channelContext}\n\n${hookPart}${scriptHookPart}${additionalPart}${typeInstr}` + NO_EM_DASH;
  },

  userContent: (
    ideaContent: string,
    type: ContentOutputType,
    additionalContext?: string
  ) =>
    additionalContext?.trim() && type !== "script"
      ? `Idea:\n${ideaContent}\n\nContext:\n${additionalContext.trim()}`
      : `Idea:\n${ideaContent}`,
} as const;
