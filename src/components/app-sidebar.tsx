import Link from "next/link";
import { Sparkles, LayoutDashboard, Lightbulb, Video, BarChart3, Film, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar({ userId: _userId }: { userId: string }) {
  const navItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Ideas", url: "/dashboard/ideas", icon: Lightbulb },
    { title: "Channel", url: "/dashboard/channel", icon: Film },
    { title: "B-roll library", url: "/dashboard/broll", icon: Video },
    { title: "Performance", url: "/dashboard/performance", icon: BarChart3 },
  ];

  return (
    <Sidebar side="left">
      <SidebarHeader className="border-b border-border px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-heading text-lg font-semibold">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Sparkles className="size-4" />
          </div>
          Co-Creator AI
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action="/auth/signout" method="post">
              <SidebarMenuButton asChild>
                <button type="submit" className="w-full">
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
