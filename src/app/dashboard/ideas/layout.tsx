import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ideas",
  description:
    "Generate and manage content ideas with AI. Each idea stays in context so you can spin it into scripts, hooks, titles, and descriptions that match your brand.",
};

export default function IdeasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
