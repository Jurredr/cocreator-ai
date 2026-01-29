import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Channel profile"),
  description:
    "Define your channel once: name, audience, goals, and content buckets. Co-Creator uses this context for every idea and script so your voice stays consistent.",
};

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
