import OpenAI from "openai";

function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Build system context for content generation from channel, buckets, and optional history.
 */
export function buildContext(params: {
  channelName: string;
  coreAudience: string | null;
  goals: string | null;
  buckets: { name: string; description: string | null }[];
  recentIdeas?: string[];
  recentScripts?: string[];
}) {
  const parts: string[] = [
    `Channel name: ${params.channelName}`,
    params.coreAudience
      ? `Core audience: ${params.coreAudience}`
      : "",
    params.goals ? `Goals: ${params.goals}` : "",
    params.buckets.length
      ? `Content buckets (themes): ${params.buckets.map((b) => `${b.name}${b.description ? ` - ${b.description}` : ""}`).join("; ")}`
      : "",
  ].filter(Boolean);
  if (params.recentIdeas?.length) {
    parts.push(
      "Recent ideas (for style reference):",
      ...params.recentIdeas.slice(0, 5).map((c) => `- ${c}`)
    );
  }
  if (params.recentScripts?.length) {
    parts.push(
      "Recent scripts (for style reference):",
      ...params.recentScripts.slice(0, 3).map((c) => `- ${c.slice(0, 200)}...`)
    );
  }
  return parts.join("\n");
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

  let userContent: string;
  if (hasRoughIdea) {
    userContent = `Channel context:\n${params.channelContext}\n\nRough idea from the creator:\n"${roughTrimmed}"\n\nTurn this rough idea into ${count} concrete, actionable content idea(s) (1-2 sentences each). Keep the creator's intent but make each idea specific and ready to film. Return JSON: { "ideas": ["...", "..."] }`;
  } else {
    const bucketLine = focusBucket
      ? `\nFocus ideas only on this content bucket: "${focusBucket}".\n`
      : "";
    userContent = `Channel context:\n${params.channelContext}${bucketLine}\nGenerate ${count} content ideas. Return JSON: { "ideas": ["...", "..."] }`;
  }

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a creative content strategist for short-form video (TikTok, Instagram Reels, YouTube Shorts). Given the channel context, suggest specific, actionable content ideas. Return only a JSON object with key "ideas" whose value is an array of strings, each string one idea (1-2 sentences). Example: { "ideas": ["Idea one...", "Idea two..."] }`,
      },
      {
        role: "user",
        content: userContent,
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
  const prompt =
    params.mode === "goals"
      ? `Channel: ${params.channelName}. Audience: ${params.coreAudience ?? "not set"}. Current goals: ${params.currentGoals ?? "none"}. Suggest improved or expanded goals (2-4 sentences). Return JSON: { "goals": "..." }`
      : params.mode === "buckets"
        ? `Channel: ${params.channelName}. Current buckets: ${JSON.stringify(params.currentBuckets)}. Suggest 3-6 content buckets (themes) with short descriptions. Return JSON: { "buckets": [ { "name": "...", "description": "..." } ] }`
        : `Channel: ${params.channelName}. Audience: ${params.coreAudience ?? "not set"}. Current goals: ${params.currentGoals ?? "none"}. Current buckets: ${JSON.stringify(params.currentBuckets)}. Suggest goals (2-4 sentences) and 3-6 content buckets with descriptions. Return JSON: { "goals": "...", "buckets": [ { "name": "...", "description": "..." } ] }`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a content strategist. Return only valid JSON, no markdown.",
      },
      { role: "user", content: prompt },
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
 */
export async function generateContentOutput(params: {
  channelContext: string;
  ideaContent: string;
  type: "title" | "description" | "hashtags" | "script" | "hooks";
  hookInspirationSample?: string[];
}): Promise<string> {
  const client = getOpenAIClient();
  const hookPart =
    params.type === "hooks" && params.hookInspirationSample?.length
      ? `Use these proven hooks as inspiration (adapt to this idea, don't copy):\n${params.hookInspirationSample.slice(0, 15).join("\n")}\n\n`
      : "";
  const typeInstructions: Record<string, string> = {
    title: "Generate a single catchy title for this idea (one line). Return only the title text, no quotes or labels.",
    description: "Generate a short platform description (2-4 sentences) for this idea. Return only the description.",
    hashtags: "Generate 5-10 relevant hashtags for TikTok/Instagram/YouTube. Return only the hashtags, comma-separated or one per line.",
    script: "Generate a short script for a 30-60 second video based on this idea. Return only the script.",
    hooks: "Generate 3-5 opening hooks (first 1-2 sentences to grab attention) for this idea. Return JSON: { \"hooks\": [\"hook1\", \"hook2\", ...] }",
  };
  const systemContent = `You are a short-form video copywriter. Channel context:\n${params.channelContext}\n\n${hookPart}${typeInstructions[params.type]}`;
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemContent },
      {
        role: "user",
        content: `Idea:\n${params.ideaContent}`,
      },
    ],
    ...(params.type === "hooks"
      ? { response_format: { type: "json_object" } }
      : {}),
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
  return raw.trim();
}
