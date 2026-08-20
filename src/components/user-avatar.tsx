import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <Avatar className={cn("h-5 w-5", className)}>
      <AvatarFallback className="bg-accent text-accent-foreground text-[9.5px] font-bold">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
