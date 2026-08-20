// Maps a color-name string (either free-text an admin picks for a Status row
// per Section 5.2, or a deterministically-assigned label for things that
// don't carry their own color like AssetType) to the design system's token
// pairs. Falls back to muted for anything unrecognized.
export const COLOR_CLASSES: Record<
  string,
  { dot: string; text: string; bg: string }
> = {
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

// The CSS custom property backing each color-name token, for contexts (like
// Recharts fills) that need a real color value rather than a Tailwind class.
const CSS_VARS: Record<string, string> = {
  accent: "var(--color-primary)",
  violet: "var(--color-violet)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  destructive: "var(--color-destructive)",
  muted: "var(--color-muted-foreground)",
};

export function cssColorForToken(color: string): string {
  return CSS_VARS[color] ?? CSS_VARS.muted;
}

const ROTATING_PALETTE = ["accent", "violet", "warning", "success"] as const;

/** Deterministically picks a palette color for something with no stored color (e.g. AssetType). */
export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) | 0;
  }
  return ROTATING_PALETTE[Math.abs(hash) % ROTATING_PALETTE.length];
}
