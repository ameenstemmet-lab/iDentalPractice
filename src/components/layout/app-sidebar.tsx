"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  CalendarClockIcon,
  CalendarDaysIcon,
  CalendarIcon,
  CalendarOffIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  StethoscopeIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react";

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
} from "@/components/ui/sidebar";
import { usePracticeContext } from "@/components/reception/practice-context";

const overviewItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Appointments", href: "/appointments", icon: CalendarDaysIcon },
  { title: "Calendar", href: "/calendar", icon: CalendarIcon },
] as const;

const practiceItems = [
  { title: "Patients", href: "/patients", icon: UsersIcon },
  { title: "Practitioners", href: "/practitioners", icon: StethoscopeIcon, staffOnly: true },
  { title: "Treatments", href: "/treatments", icon: UserCogIcon, staffOnly: true },
] as const;

const schedulingItems = [
  { title: "Working Hours", href: "/working-hours", icon: CalendarClockIcon, staffOnly: true },
  { title: "Blocked Time", href: "/blocked-time", icon: CalendarOffIcon, staffOnly: true },
] as const;

const footerItems = [
  { title: "Google Calendar", href: "/settings/integrations/google-calendar", icon: CalendarIcon, staffOnly: true },
  { title: "Reports", href: "/reports", icon: BarChart3Icon, staffOnly: true },
  { title: "Settings", href: "/settings", icon: SettingsIcon, staffOnly: true },
] as const;

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  staffOnly?: boolean;
}

function NavGroup({
  label,
  items,
  pathname,
  isStaff,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string | null;
  isStaff: boolean;
}) {
  const visibleItems = items.filter((item) => isStaff || !item.staffOnly);
  if (visibleItems.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={pathname?.startsWith(item.href)}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** The reception & practice administration portal's primary navigation. */
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { role } = usePracticeContext();
  const isStaff = role === "staff";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  iP
                </span>
                <span className="text-sm font-semibold tracking-tight">iPractice</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Overview" items={overviewItems} pathname={pathname} isStaff={isStaff} />
        <NavGroup label="Practice" items={practiceItems} pathname={pathname} isStaff={isStaff} />
        <NavGroup label="Scheduling" items={schedulingItems} pathname={pathname} isStaff={isStaff} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.filter((item) => isStaff || !item.staffOnly).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild tooltip={item.title} isActive={pathname?.startsWith(item.href)}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
