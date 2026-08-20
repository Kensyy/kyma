import { cn } from "@/lib/utils";
import { COLOR_CLASSES } from "@/lib/color-tokens";

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
