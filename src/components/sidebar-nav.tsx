"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { WaveMark } from "@/components/wave-mark";
import { UserMenu } from "@/components/user-menu";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2.5" y="2.5" width="6.2" height="6.2" rx="1.3" />
        <rect x="11.3" y="2.5" width="6.2" height="6.2" rx="1.3" />
        <rect x="2.5" y="11.3" width="6.2" height="6.2" rx="1.3" />
        <rect x="11.3" y="11.3" width="6.2" height="6.2" rx="1.3" />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2.5 6.8a1.7 1.7 0 0 0 0 3.3v3.2a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-3.2a1.7 1.7 0 0 1 0-3.3V4.7a1 1 0 0 0-1-1h-13a1 1 0 0 0-1 1z" />
      </svg>
    ),
  },
  {
    href: "/assets",
    label: "Assets",
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2.3 16.8 5.8v8.4L10 17.7l-6.8-3.5V5.8z" />
        <path d="M3.2 5.8 10 9.3l6.8-3.5M10 9.3v8.4" />
      </svg>
    ),
  },
  {
    href: "/admin",
    label: "Admin",
    adminOnly: true,
    icon: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 2.5 16.5 5v4.5c0 4-2.7 6.8-6.5 8-3.8-1.2-6.5-4-6.5-8V5z" />
        <path d="M7.3 10.1l1.8 1.8 3.6-3.8" />
      </svg>
    ),
  },
];

export function SidebarNav({
  role,
  userName,
}: {
  role: string;
  userName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-screen w-58 min-w-58 flex-col border-r p-3.5">
      <div className="flex items-center gap-2 px-2 pt-1.5 pb-5">
        <WaveMark className="text-sidebar-primary" />
        <span className="font-heading text-base font-bold tracking-tight">
          Kyma
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {navItems
          .filter((item) => !item.adminOnly || role === "ADMIN")
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="mt-auto border-t pt-3">
        <UserMenu name={userName} role={role} />
      </div>
    </div>
  );
}
