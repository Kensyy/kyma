export function WaveMark({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 30 30"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2 19c3-4 5-4 8 0s5 4 8 0 5-4 8 0"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M2 12c3-4 5-4 8 0s5 4 8 0 5-4 8 0"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}
