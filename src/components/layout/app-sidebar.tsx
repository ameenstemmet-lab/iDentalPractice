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

const overviewItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Appointments", href: "/appointments", icon: CalendarDaysIcon },
  { title: "Calendar", href: "/calendar", icon: CalendarIcon },
] as const;

const practiceItems = [
  { title: "Patients", href: "/patients", icon: UsersIcon },
  { title: "Dentists", href: "/dentists", icon: StethoscopeIcon },
  { title: "Treatments", href: "/treatments", icon: UserCogIcon },
] as const;

const schedulingItems = [
  { title: "Working Hours", href: "/working-hours", icon: CalendarClockIcon },
  { title: "Blocked Time", href: "/blocked-time", icon: CalendarOffIcon },
] as const;

const footerItems = [
  { title: "Google Calendar", href: "/settings/integrations/google-calendar", icon: CalendarIcon },
  { title: "Reports", href: "/reports", icon: BarChart3Icon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
] as const;

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: ReadonlyArray<{ title: string; href: string; icon: React.ComponentType<{ className?: string }> }>;
  pathname: string | null;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                  iD
                </span>
                <span className="text-sm font-semibold tracking-tight">iDentalPractice</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Overview" items={overviewItems} pathname={pathname} />
        <NavGroup label="Practice" items={practiceItems} pathname={pathname} />
        <NavGroup label="Scheduling" items={schedulingItems} pathname={pathname} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => (
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
