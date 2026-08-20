import { cn } from "@/lib/utils";

// Maps the free-text `color` an admin picks for a Status row (Section 5.2)
// to the design system's token pairs. Falls back to muted for anything else.
const COLOR_CLASSES: Record<string, { dot: string; text: string; bg: string }> =
  {
    accent: { dot: "bg-primary", text: "text-primary", bg: "bg-accent" },
    violet: { dot: "bg-violet", text: "text-violet", bg: "bg-violet/15" },
    success: { dot: "bg-success", text: "text-success", bg: "bg-success/15" },
    warning: { dot: "bg-warning", text: "text-warning", bg: "bg-warning/15" },
    destructive: {
      dot: "bg-destructive",
      text: "text-destructive",
      bg: "bg-destructive/10",
    },
    muted: {
      dot: "bg-muted-foreground",
      text: "text-muted-foreground",
      bg: "bg-muted",
    },
  };

export function StatusBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.muted;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        classes.bg,
        classes.text,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", classes.dot)} />
      {label}
    </span>
  );
}
