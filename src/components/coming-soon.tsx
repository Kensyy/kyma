export function ComingSoon({
  title,
  milestone,
}: {
  title: string;
  milestone: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-7 text-center">
      <h1 className="font-heading text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Not built yet — landing in {milestone} of the build order.
      </p>
    </div>
  );
}
