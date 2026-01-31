import OpenAI from "openai";
import {
  PROJECT_SUMMARY,
  IDEAS,
  BRAINSTORM_SUB_IDEAS,
  BRAINSTORM_NOTE,
  GOALS_AND_BUCKETS,
  CONTENT_OUTPUT,
} from "./prompts";

function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Generate a one-line summary of a script (what was said/promised/set up).
 * Used for narrative continuity in context.
 */
export async function generateProjectSummary(scriptText: string): Promise<string> {
  const client = getOpenAIClient();
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PROJECT_SUMMARY.system },
      { role: "user", content: scriptText.slice(0, 3000) },
    ],
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw?.trim()) return "";
  return raw.trim();
}

/**
 * Generate content ideas based on channel context.
 * Optional: focus on a bucket, or refine a rough idea into concrete ideas.
 */
export async function generateIdeas(params: {
  channelContext: string;
  count?: number;
  focusBucketName?: string | null;
  roughIdea?: string | null;
}): Promise<string[]> {
  const client = getOpenAIClient();
  const roughTrimmed = (params.roughIdea ?? "").trim();
  const count = roughTrimmed ? Math.min(3, params.count ?? 3) : params.count ?? 3;
  const hasRoughIdea = Boolean(roughTrimmed);
  const focusBucket = params.focusBucketName?.trim() || null;

  const userContent = hasRoughIdea
    ? IDEAS.userWithRoughIdea(params.channelContext, roughTrimmed, count)
    : IDEAS.userWithoutRoughIdea(params.channelContext, focusBucket, count);

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: IDEAS.system },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }
  const parsed = JSON.parse(raw) as { ideas?: string[] };
  const arr = parsed.ideas ?? [];
  return arr.slice(0, count);
}

/**
 * Brainstorm sub-ideas / parts for a given idea (for the graph canvas).
 */
export async function brainstormSubIdeas(params: {
  channelContext: string;
  parentIdeaContent: string;
  count?: number;
}): Promise<string[]> {
  const client = getOpenAIClient();
  const count = params.count ?? 4;
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: BRAINSTORM_SUB_IDEAS.system },
      {
        role: "user",
        content: BRAINSTORM_SUB_IDEAS.user(
          params.channelContext,
          params.parentIdeaContent,
          count
        ),
      },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }
  const parsed = JSON.parse(raw) as { ideas?: string[] };
  const arr = parsed.ideas ?? [];
  return arr.slice(0, count);
}

/**
 * Brainstorm or refine a single note/card (e.g. expand a sub-idea with AI).
 * When the note is empty or very short, generates a new idea from channel context instead of refining.
 */
export async function brainstormNote(params: {
  channelContext: string;
  noteContent: string;
  instruction?: string;
}): Promise<string> {
  const client = getOpenAIClient();
  const trimmed = (params.noteContent ?? "").trim();
  const isEmptyOrPlaceholder =
    !trimmed ||
    trimmed.length < 10 ||
    /empty note|suggest something|add here/i.test(trimmed);

  const systemContent = isEmptyOrPlaceholder
    ? BRAINSTORM_NOTE.systemEmpty
    : BRAINSTORM_NOTE.systemRefine(
        params.channelContext,
        params.instruction ?? "Expand and refine this note into a clearer, more actionable version. Keep the same intent."
      );
  const userContent = isEmptyOrPlaceholder
    ? BRAINSTORM_NOTE.userEmpty(params.channelContext)
    : params.noteContent;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }
  const result = raw.trim();
  if (
    /input is unclear|provide more details|can't assist|I cannot|I'm unable/i.test(
      result
    )
  ) {
    throw new Error("AI couldn't refine this—try adding a bit more text to the idea first.");
  }
  return result;
}

/**
 * Brainstorm or refine goals and buckets for a channel.
 */
export async function brainstormGoalsAndBuckets(params: {
  channelName: string;
  coreAudience: string | null;
  currentGoals: string | null;
  currentBuckets: { name: string; description: string | null }[];
  mode: "goals" | "buckets" | "both";
}): Promise<{ goals?: string; buckets?: { name: string; description: string }[] }> {
  const client = getOpenAIClient();
  const userPrompt =
    params.mode === "goals"
      ? GOALS_AND_BUCKETS.userGoals(
          params.channelName,
          params.coreAudience,
          params.currentGoals
        )
      : params.mode === "buckets"
        ? GOALS_AND_BUCKETS.userBuckets(params.channelName, params.currentBuckets)
        : GOALS_AND_BUCKETS.userBoth(
            params.channelName,
            params.coreAudience,
            params.currentGoals,
            params.currentBuckets
          );

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: GOALS_AND_BUCKETS.system },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }
  return JSON.parse(raw) as {
    goals?: string;
    buckets?: { name: string; description: string }[];
  };
}

/**
 * Generate a single content output (title, description, hashtags, script, or hooks).
 * For script: optional openingHook (use as first 1-2 sentences) and additionalContext (from idea blocks).
 */
export async function generateContentOutput(params: {
  channelContext: string;
  ideaContent: string;
  type: "title" | "description" | "hashtags" | "script" | "hooks";
  hookInspirationSample?: string[];
  openingHook?: string;
  additionalContext?: string;
}): Promise<string> {
  const client = getOpenAIClient();
  const hookPart =
    params.type === "hooks" && params.hookInspirationSample?.length
      ? CONTENT_OUTPUT.hookInspirationBlock(params.hookInspirationSample)
      : "";
  const scriptHookPart =
    params.type === "script" && params.openingHook?.trim()
      ? CONTENT_OUTPUT.scriptHookBlock(params.openingHook)
      : "";
  const additionalPart =
    params.additionalContext?.trim()
      ? CONTENT_OUTPUT.additionalContextBlock(params.additionalContext)
      : "";

  const systemContent = CONTENT_OUTPUT.systemContent(
    params.channelContext,
    params.type,
    {
      hookPart,
      scriptHookPart,
      additionalPart,
      openingHook: params.openingHook?.trim(),
    }
  );
  const userContent = CONTENT_OUTPUT.userContent(
    params.ideaContent,
    params.type,
    params.additionalContext
  );

  const useJson = params.type === "hooks" || params.type === "script";
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContent },
      { role: "user", content: userContent },
    ],
    ...(useJson ? { response_format: { type: "json_object" } } : {}),
  });
  const raw = res.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("No response from OpenAI");
  }
  if (params.type === "hooks") {
    const parsed = JSON.parse(raw) as { hooks?: string[] } | string[];
    const arr = Array.isArray(parsed) ? parsed : parsed.hooks ?? [];
    return arr.join("\n---\n");
  }
  if (params.type === "script") {
    const parsed = JSON.parse(raw) as { hook?: string; body?: string; end?: string };
    const hook = typeof parsed.hook === "string" ? parsed.hook.trim() : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
    const end = typeof parsed.end === "string" ? parsed.end.trim() : "";
    return JSON.stringify({ hook, body, end });
  }
  return raw.trim();
}
