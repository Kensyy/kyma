const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
];

const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** Renders a past timestamp as "2h ago", "3d ago", etc. (falls back to "just now"). */
export function relativeTime(
  input: string | Date,
  now: Date = new Date(),
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const diffMs = date.getTime() - now.getTime();

  for (const [unit, ms] of UNITS) {
    if (Math.abs(diffMs) >= ms) {
      return formatter.format(Math.round(diffMs / ms), unit);
    }
  }
  return "just now";
}
