'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { BlocksIcon, type BlocksIconHandle } from '@/components/ui/blocks';
import { ChartSplineIcon, type ChartSplineIconHandle } from '@/components/ui/chart-spline';
import { ClapIcon, type ClapIconHandle } from '@/components/ui/clap';
import { ZapIcon, type ZapHandle } from '@/components/ui/zap';
import { GalleryHorizontalEndIcon, type GalleryHorizontalEndIconHandle } from '@/components/ui/gallery-horizontal-end';
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
import { SidebarNavIcon } from '@/components/sidebar-nav-icon';
import { NavUser } from '@/components/nav-user';

const navHoverVariants = { rest: {}, hover: {} };

type AnimatedIconKey = 'blocks' | 'flask' | 'gallery' | 'clap' | 'chart';

type NavItem = {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    animatedIconKey?: AnimatedIconKey;
};

type AppSidebarProps = {
    userEmail?: string | null;
    userName?: string | null;
    userImageUrl?: string | null;
};

const navGroups: { label: string; items: NavItem[] }[] = [
    {
        label: 'Overview',
        items: [
            { title: 'Dashboard', url: '/dashboard', icon: BlocksIcon, animatedIconKey: 'blocks' },
        ],
    },
    {
        label: 'Content',
        items: [
            { title: 'Ideas', url: '/dashboard/ideas', icon: ZapIcon, animatedIconKey: 'flask' },
            {
                title: 'B-roll library',
                url: '/dashboard/broll',
                icon: GalleryHorizontalEndIcon,
                animatedIconKey: 'gallery',
            },
        ],
    },
    {
        label: 'Channel',
        items: [
            { title: 'Channel profile', url: '/dashboard/channel', icon: ClapIcon, animatedIconKey: 'clap' },
        ],
    },
    {
        label: 'Analytics',
        items: [
            {
                title: 'Performance',
                url: '/dashboard/performance',
                icon: ChartSplineIcon,
                animatedIconKey: 'chart',
            },
        ],
    },
];

type AnimatedIconRef =
    | BlocksIconHandle
    | ZapHandle
    | GalleryHorizontalEndIconHandle
    | ClapIconHandle
    | ChartSplineIconHandle;

export function AppSidebar({
    userEmail,
    userName,
    userImageUrl,
}: AppSidebarProps) {
    const pathname = usePathname();
    const blocksRef = useRef<BlocksIconHandle>(null);
    const flaskRef = useRef<ZapHandle>(null);
    const galleryRef = useRef<GalleryHorizontalEndIconHandle>(null);
    const clapRef = useRef<ClapIconHandle>(null);
    const chartRef = useRef<ChartSplineIconHandle>(null);

    const animatedRefs: Record<AnimatedIconKey, React.RefObject<AnimatedIconRef | null>> = {
        blocks: blocksRef,
        flask: flaskRef,
        gallery: galleryRef,
        clap: clapRef,
        chart: chartRef,
    };

    const animatedIcons: Record<
        AnimatedIconKey,
        React.ForwardRefExoticComponent<
            { size?: number; className?: string } & React.RefAttributes<AnimatedIconRef>
        >
    > = {
        blocks: BlocksIcon,
        flask: ZapIcon,
        gallery: GalleryHorizontalEndIcon,
        clap: ClapIcon,
        chart: ChartSplineIcon,
    };

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
                                <div className="flex flex-1 items-center gap-2 overflow-hidden group-data-[state=collapsed]:justify-center">
                                    <div className="bg-primary text-primary-foreground flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg">
                                        <Sparkles className="size-4" />
                                    </div>
                                    <div className="grid flex-1 text-left text-lg leading-tight min-w-0 group-data-[state=collapsed]:hidden">
                                        <span className="font-heading font-semibold truncate">
                                            Co-Creator AI
                                        </span>
                                    </div>
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
                                                    <motion.div
                                                        className="flex flex-1 items-center gap-2 overflow-hidden group-data-[state=collapsed]:justify-center"
                                                        initial="rest"
                                                        whileHover="hover"
                                                        variants={navHoverVariants}
                                                        onMouseEnter={
                                                            item.animatedIconKey
                                                                ? () => animatedRefs[item.animatedIconKey!].current?.startAnimation()
                                                                : undefined
                                                        }
                                                        onMouseLeave={
                                                            item.animatedIconKey
                                                                ? () => animatedRefs[item.animatedIconKey!].current?.stopAnimation()
                                                                : undefined
                                                        }
                                                    >
                                                        {item.animatedIconKey ? (
                                                            (() => {
                                                                const IconComponent = animatedIcons[item.animatedIconKey];
                                                                const iconRef = animatedRefs[item.animatedIconKey];
                                                                return (
                                                                    <IconComponent
                                                                        ref={iconRef as React.Ref<AnimatedIconRef>}
                                                                        size={16}
                                                                        className="size-4 shrink-0"
                                                                    />
                                                                );
                                                            })()
                                                        ) : (
                                                            <SidebarNavIcon>
                                                                <item.icon className="size-4 shrink-0" />
                                                            </SidebarNavIcon>
                                                        )}
                                                        <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                                                    </motion.div>
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
