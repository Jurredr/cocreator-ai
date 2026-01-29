import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B-roll library",
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
