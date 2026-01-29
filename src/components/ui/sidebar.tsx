"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    data-sidebar=""
    ref={ref}
    className={cn("flex h-svh w-full", className)}
    {...props}
  />
));
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }
>(({ side = "left", className, ...props }, ref) => (
  <div
    data-sidebar={side}
    ref={ref}
    className={cn(
      "flex h-full w-64 flex-col border-r bg-muted/40",
      className
    )}
    {...props}
  />
));
Sidebar.displayName = "Sidebar";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "relative flex flex-1 flex-col overflow-auto",
      className
    )}
    {...props}
  />
));
SidebarInset.displayName = "SidebarInset";

const sidebarHeaderVariants = cva(
  "flex h-12 shrink-0 items-center gap-2 border-b px-4"
);

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof sidebarHeaderVariants>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn(sidebarHeaderVariants(), className)}
    {...props}
  />
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn("flex flex-1 flex-col gap-2 overflow-auto p-2", className)}
    {...props}
  />
));
SidebarContent.displayName = "SidebarContent";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn("mt-auto flex flex-col gap-2 p-2", className)}
    {...props}
  />
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group relative flex w-full min-w-0", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer flex w-full items-center gap-2 rounded-md p-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[active=true]:bg-accent data-[active=true]:font-medium data-[state=open]:hover:bg-accent",
  {
    variants: {
      variant: {
        default: "hover:bg-accent hover:text-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--border))] hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--accent))]",
      },
      size: {
        default: "h-8 justify-start",
        sm: "h-7 gap-1.5 px-2",
        lg: "h-10 gap-2 px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ReactNode;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1 text-[10px] font-medium text-primary-foreground",
      className
    )}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

export {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
};
