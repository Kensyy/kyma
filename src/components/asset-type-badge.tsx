import { cn } from "@/lib/utils";
import { COLOR_CLASSES, colorForLabel } from "@/lib/color-tokens";

function initials(label: string) {
  const words = label.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

export function AssetTypeBadge({ label }: { label: string }) {
  const classes = COLOR_CLASSES[colorForLabel(label)];

  return (
    <span
      className={cn(
        "inline-flex h-5 w-6.5 shrink-0 items-center justify-center rounded text-[9.5px] font-bold",
        classes.bg,
        classes.text,
      )}
      title={label}
    >
      {initials(label)}
    </span>
  );
}
