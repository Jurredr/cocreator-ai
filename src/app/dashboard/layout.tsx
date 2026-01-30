import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { pageTitle } from "@/lib/metadata";

export const metadata: Metadata = {
  title: pageTitle("Dashboard"),
  description:
    "Your content command center. See recent ideas and scripts, generate new ideas, and jump into your Media library, channel profile, and performance.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email ?? null;
  const userName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;
  const userImageUrl =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={userEmail}
        userName={userName}
        userImageUrl={userImageUrl}
      />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col overflow-auto bg-muted/30">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
