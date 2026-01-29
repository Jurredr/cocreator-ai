import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New idea",
  description:
    "Generate a new content idea with AI. Uses your channel, audience, goals, and content buckets so every idea fits your brand.",
};

export default function NewIdeaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
