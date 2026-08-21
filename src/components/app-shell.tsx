"use client";

import { useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { WaveMark } from "@/components/wave-mark";
import { cn } from "@/lib/utils";

// The sidebar is a static column at md+ but a slide-in drawer below that —
// both live states share one `open` flag here since the hamburger trigger
// (in the mobile top bar) and the drawer itself are siblings, not
// parent/child, so the toggle can't live inside SidebarNav.
export function AppShell({
  role,
  userName,
  children,
}: {
  role: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-screen w-full">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 -translate-x-full transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <SidebarNav
          role={role}
          userName={userName}
          onNavigate={() => setOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="bg-sidebar text-sidebar-foreground flex items-center gap-2 border-b p-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="hover:bg-sidebar-accent/60 rounded-md p-1.5"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M3 5.5h14M3 10h14M3 14.5h14" />
            </svg>
          </button>
          <WaveMark className="text-sidebar-primary" />
          <span className="font-heading text-base font-bold tracking-tight">
            Kyma
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
