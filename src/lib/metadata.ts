/**
 * Shared SEO metadata for Co-Creator AI.
 * Use with Next.js Metadata API; OG images to be added per-route as needed.
 */

export const SITE_NAME = "Co-Creator AI";

export const DEFAULT_DESCRIPTION =
  "Your AI co-pilot for short-form content. Generate ideas, scripts, hooks, and copy that stay on-brand—with memory of your channel, style, and what works.";

export const DEFAULT_KEYWORDS = [
  "content creator",
  "AI writing",
  "TikTok scripts",
  "Instagram Reels",
  "YouTube Shorts",
  "short-form video",
  "content ideas",
  "script generator",
  "hook generator",
  "on-brand copy",
];

/** Build full page title so the brand always appears: "PageName · Co-Creator AI" */
export function pageTitle(segment: string): string {
  return `${segment} · ${SITE_NAME}`;
}

export const ROOT_METADATA = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://cocreator.ai"
  ),
  title: {
    default: SITE_NAME,
    template: "%s", // We set full titles via pageTitle() per route; template required by type.
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  openGraph: {
    type: "website" as const,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    // images: add per-route or here when ready
  },
  twitter: {
    card: "summary_large_image" as const,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    // images: add when ready
  },
  robots: {
    index: true,
    follow: true,
  },
};
