"use client";

import { motion } from "motion/react";

/**
 * To use icons from lucide-animated (hover animations), add them via:
 *   bunx --bun shadcn add @lucide-animated/<icon-name>
 * e.g. bunx --bun shadcn add @lucide-animated/calendar-check
 * Then use the generated component in the sidebar instead of the Lucide icon.
 */

const iconVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.15 },
};

const transition = { type: "spring" as const, stiffness: 400, damping: 15 };

/**
 * Wraps a sidebar nav icon so it animates when the parent link/button is hovered.
 * Parent must be a motion component with variants that pass "hover" / "rest".
 */
export function SidebarNavIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      variants={iconVariants}
      transition={transition}
    >
      {children}
    </motion.span>
  );
}
