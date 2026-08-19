"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
  END_USER: "End user",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserMenu({ name, role }: { name: string; role: string }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-sidebar-accent/60 flex items-center gap-2.5 rounded-md px-1 py-1 text-left outline-none">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-accent text-accent-foreground text-[11px] font-bold">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground text-[10.5px]">
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-48">
        <DropdownMenuLabel>{name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            router.push("/sign-in");
            router.refresh();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
