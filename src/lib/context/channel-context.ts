/**
 * Channel context for AI generation: style, history, continuity, inspiration, performance.
 * Single source of truth for building the system prompt string used in all generation paths.
 */

export type ChannelContextParams = {
  channelName: string;
  coreAudience: string | null;
  goals: string | null;
  buckets: { name: string; description: string | null }[];
  /** Last N project idea texts (project.content). */
  recentIdeas: string[];
  /** Last N script outputs (content_outputs where type = script). */
  recentScripts: string[];
  /** Last N (or all) project summaries with optional sequence label / story beat. */
  projectSummaries: Array<{
    sequenceLabel?: string | null;
    storyBeat?: string | null;
    summary?: string | null;
  }>;
  /** Notes from inspiration videos (what the creator likes). */
  inspirationNotes: string[];
  /** Top performing content: title/idea + views for context. */
  topPerformers: Array<{ titleOrIdea: string; views: number | null }>;
  /** Optional: e.g. "Day 35" for next video (series/challenge). */
  nextSequenceLabel?: string | null;
};

const RECENT_IDEAS_MAX = 10;
const RECENT_SCRIPTS_MAX = 10;
const SCRIPT_SNIPPET_CHARS = 400;
const SUMMARIES_MAX = 50;
const TOP_PERFORMERS_MAX = 5;
const INSPIRATION_MAX = 10;

/**
 * Build the full channel context string for AI generation.
 * Used by all generation paths (ideas, script, hooks, title, description, hashtags).
 */
export function buildChannelContext(params: ChannelContextParams): string {
  const parts: string[] = [
    `Channel name: ${params.channelName}`,
    params.coreAudience ? `Core audience: ${params.coreAudience}` : "",
    params.goals ? `Goals: ${params.goals}` : "",
    params.buckets.length
      ? `Content buckets (themes): ${params.buckets.map((b) => `${b.name}${b.description ? ` - ${b.description}` : ""}`).join("; ")}`
      : "",
  ].filter(Boolean);

  if (params.nextSequenceLabel?.trim()) {
    parts.push(`Next video / today: ${params.nextSequenceLabel.trim()}.`);
  }

  if (params.recentIdeas.length) {
    const ideas = params.recentIdeas.slice(0, RECENT_IDEAS_MAX);
    parts.push("Recent ideas (for style reference):", ...ideas.map((c) => `- ${c}`));
  }

  if (params.recentScripts.length) {
    const scripts = params.recentScripts.slice(0, RECENT_SCRIPTS_MAX);
    parts.push(
      "Recent scripts (for style reference):",
      ...scripts.map((c) => `- ${c.length > SCRIPT_SNIPPET_CHARS ? c.slice(0, SCRIPT_SNIPPET_CHARS) + "..." : c}`)
    );
  }

  if (params.projectSummaries.length) {
    const summaries = params.projectSummaries.slice(0, SUMMARIES_MAX);
    const lines = summaries
      .map((s) => {
        const label = s.sequenceLabel?.trim();
        const beat = s.storyBeat?.trim();
        const sum = s.summary?.trim();
        const text = beat || sum || "";
        return label ? `${label}: ${text}` : text;
      })
      .filter(Boolean);
    if (lines.length) {
      parts.push("Past content (for continuity / callbacks):", ...lines.map((l) => `- ${l}`));
    }
  }

  if (params.inspirationNotes.length) {
    const notes = params.inspirationNotes.slice(0, INSPIRATION_MAX);
    parts.push("Channel vibe / inspiration:", ...notes.map((n) => `- ${n}`));
  }

  if (params.topPerformers.length) {
    const top = params.topPerformers.slice(0, TOP_PERFORMERS_MAX);
    parts.push(
      "Content that performed well (prefer similar topics/tone):",
      ...top.map((t) => `- ${t.titleOrIdea}${t.views != null ? ` (${t.views} views)` : ""}`)
    );
  }

  return parts.join("\n");
}
