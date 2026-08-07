"use client";

import * as React from "react";
import Link from "next/link";
import { BellIcon, LogOutIcon, SettingsIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlobalSearch } from "@/components/reception/global-search";
import { logoutAction } from "@/features/auth/actions";

interface NavbarProps extends React.ComponentProps<"header"> {
  title?: string;
  practiceName?: string;
  userEmail?: string;
}

/**
 * Top app bar, paired with AppSidebar inside a SidebarInset. Sidebar
 * collapse trigger, current-practice label, page title slot, global
 * search, notifications, theme toggle, account menu.
 */
export function Navbar({ title, practiceName, userEmail, className, ...props }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-glass",
        className
      )}
      {...props}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      {practiceName ? (
        <span className="truncate text-sm font-semibold text-foreground">{practiceName}</span>
      ) : null}
      {title ? (
        <>
          {practiceName ? <span className="text-muted-foreground">/</span> : null}
          <h1 className="truncate text-sm font-medium text-muted-foreground">{title}</h1>
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-1.5">
        <GlobalSearch />
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <BellIcon />
        </Button>
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 h-5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full transition-opacity duration-fast hover:opacity-80 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">DR</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{practiceName ?? "Practice"}</p>
              <p className="truncate text-xs text-muted-foreground">{userEmail ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => logoutAction()}>
              <LogOutIcon />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
