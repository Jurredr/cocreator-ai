"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PanelLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  ideas: "Ideas",
  channel: "Channel",
  broll: "B-roll library",
  performance: "Performance",
  new: "New idea",
};

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return [{ label: "Dashboard", href: "/dashboard", isPage: true }];
  }
  const result: { label: string; href: string; isPage: boolean }[] = [];
  let path = "";
  for (let i = 0; i < segments.length; i++) {
    path += `/${segments[i]}`;
    const segment = segments[i];
    const label =
      SEGMENT_LABELS[segment] ??
      (segment.length === 36 ? "Idea" : segment);
    result.push({
      label,
      href: path,
      isPage: i === segments.length - 1,
    });
  }
  return result;
}

export function DashboardHeader() {
  const pathname = usePathname();
  const items = getBreadcrumbItems(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2 px-2">
        <SidebarTrigger className="-ml-1" aria-label="Toggle sidebar">
          <PanelLeft className="size-4" />
        </SidebarTrigger>
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {items.map((item, i) => (
              <React.Fragment key={item.href}>
                {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
                <BreadcrumbItem className={item.isPage ? undefined : "hidden sm:block"}>
                  {item.isPage ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
