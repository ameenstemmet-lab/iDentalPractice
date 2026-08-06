"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  CalendarPlusIcon,
  CalendarRangeIcon,
  ClockIcon,
  StethoscopeIcon,
  UserPlusIcon,
  UserXIcon,
  UsersIcon,
  WalletIcon,
  XCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/reception/stat-card";
import { QuickActionButton } from "@/components/reception/quick-action-button";
import { Timeline } from "@/components/reception/timeline";
import { SkeletonList } from "@/components/shared/skeleton-patterns";
import { usePracticeContext } from "@/components/reception/practice-context";
import { useDashboardStats, useRecentActivity } from "@/features/reception/dashboard/queries";
import { getConnectionStatusAction } from "@/features/integrations/google-calendar/actions/google-calendar-actions";

function useGoogleCalendarStatus(practiceId: string) {
  return useQuery({
    queryKey: ["dashboard-gcal-status", practiceId],
    queryFn: () => getConnectionStatusAction(practiceId, null),
    enabled: Boolean(practiceId),
  });
}

export default function DashboardPage() {
  const { practiceId, practiceName } = usePracticeContext();
  const stats = useDashboardStats(practiceId ?? "");
  const activity = useRecentActivity(practiceId ?? "");
  const gcal = useGoogleCalendarStatus(practiceId ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {practiceName ? `Welcome back, ${practiceName}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Today's appointments"
          value={stats.data?.todayAppointments ?? 0}
          icon={CalendarDaysIcon}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Upcoming (7 days)"
          value={stats.data?.upcomingAppointments ?? 0}
          icon={CalendarRangeIcon}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Patients this week"
          value={stats.data?.patientsThisWeek ?? 0}
          icon={UsersIcon}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Cancelled (7 days)"
          value={stats.data?.cancelledThisWeek ?? 0}
          icon={XCircleIcon}
          tone="destructive"
          isLoading={stats.isLoading}
        />
        <StatCard
          label="No shows (7 days)"
          value={stats.data?.noShowsThisWeek ?? 0}
          icon={UserXIcon}
          tone="warning"
          isLoading={stats.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>The latest appointments booked across the practice.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.isLoading ? <SkeletonList items={5} /> : <Timeline items={activity.data ?? []} />}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {gcal.isLoading ? (
                <p className="text-sm text-muted-foreground">Checking…</p>
              ) : gcal.data ? (
                <div className="flex flex-col gap-2">
                  <Badge variant={gcal.data.status === "connected" ? "success" : "destructive"}>
                    {gcal.data.status === "connected" ? "Connected" : "Needs attention"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{gcal.data.accountEmail}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary">Not connected</Badge>
                  <Link href="/settings/integrations/google-calendar" className="text-xs text-primary hover:underline">
                    Connect a calendar →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="success">Active</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5">
                <WalletIcon className="size-4 text-muted-foreground" />
                Revenue
              </CardTitle>
              <CardDescription>Placeholder — billing isn&apos;t built yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight text-muted-foreground/50">R —</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionButton href="/appointments" label="New appointment" icon={CalendarPlusIcon} />
          <QuickActionButton href="/patients" label="Add patient" icon={UserPlusIcon} />
          <QuickActionButton href="/dentists" label="Manage dentists" icon={StethoscopeIcon} />
          <QuickActionButton href="/working-hours" label="Working hours" icon={ClockIcon} />
        </div>
      </div>
    </div>
  );
}
