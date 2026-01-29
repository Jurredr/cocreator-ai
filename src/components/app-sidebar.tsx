'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sparkles,
    LayoutDashboard,
    Lightbulb,
    Video,
    BarChart3,
    Film,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';

type AppSidebarProps = {
    userEmail?: string | null;
    userName?: string | null;
    userImageUrl?: string | null;
};

const navGroups = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        label: 'Content',
        items: [
            { title: 'Ideas', url: '/dashboard/ideas', icon: Lightbulb },
            { title: 'B-roll library', url: '/dashboard/broll', icon: Video },
        ],
    },
    {
        label: 'Channel',
        items: [
            { title: 'Channel profile', url: '/dashboard/channel', icon: Film },
        ],
    },
    {
        label: 'Analytics',
        items: [
            {
                title: 'Performance',
                url: '/dashboard/performance',
                icon: BarChart3,
            },
        ],
    },
];

export function AppSidebar({
    userEmail,
    userName,
    userImageUrl,
}: AppSidebarProps) {
    const pathname = usePathname();

    const user = {
        name: userName ?? userEmail ?? 'User',
        email: userEmail ?? null,
        avatar: userImageUrl ?? null,
    };

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="border-sidebar-border group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:[&_ul]:items-center">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="px-1" asChild>
                            <Link href="/dashboard">
                                <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                                    <Sparkles className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-lg leading-tight min-w-0">
                                    <span className="font-heading font-semibold truncate">
                                        Co-Creator AI
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {navGroups.map((group) => (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => {
                                    const isActive =
                                        pathname === item.url ||
                                        (item.url !== '/dashboard' &&
                                            pathname.startsWith(item.url));
                                    return (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                            >
                                                <Link href={item.url}>
                                                    <item.icon className="size-4 shrink-0" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter className="border-sidebar-border mt-auto">
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
