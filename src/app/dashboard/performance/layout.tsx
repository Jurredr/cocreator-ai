import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Performance"),
  description:
    "Track how your content performs. Link published posts, log views and engagement, and use the data to inform what to create next.",
};

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
