import { cn } from "@/lib/utils";

const PRIORITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function FlagIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 3 18 16H2z" />
      <path d="M10 8.5v3.2" />
    </svg>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const label = PRIORITY_LABEL[priority] ?? priority;

  if (priority === "URGENT") {
    return (
      <span className="bg-destructive inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide text-white uppercase">
        {label}
      </span>
    );
  }

  const colorClass =
    priority === "HIGH"
      ? "text-destructive"
      : priority === "MEDIUM"
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold",
        colorClass,
      )}
    >
      <FlagIcon />
      {label}
    </span>
  );
}
