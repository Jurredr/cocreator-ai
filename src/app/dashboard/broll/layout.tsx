import type { Metadata } from "next";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("B-roll library"),
  description:
    "Your searchable library of B-roll clips. Upload footage, add descriptions, and reference it when generating scripts so your ideas stay grounded in what you can actually shoot.",
};

export default function BrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
