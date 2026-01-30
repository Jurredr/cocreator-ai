import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Media library"),
  description:
    "Videos and images for your content: B-roll, thumbnails, post assets, and AI-generated images from projects. Upload videos (vertical 9:16 or horizontal 16:9) and images, or use the AI-generated tab for project assets.",
};

export default function BrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
