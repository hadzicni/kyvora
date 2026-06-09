import { cn } from "@/lib/utils";

export type HealthSegment = {
  className: string;
  label: string;
  value: number;
};

export function HealthBar({
  segments,
  total,
}: {
  segments: HealthSegment[];
  total: number;
}) {
  if (total <= 0) {
    return <div className="h-2 rounded-full bg-muted" />;
  }

  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-muted">
      {segments.map((segment) => {
        const width = Math.max(0, (segment.value / total) * 100);

        if (width === 0) {
          return null;
        }

        return (
          <div
            aria-label={`${segment.label}: ${segment.value}`}
            className={cn("min-w-1", segment.className)}
            key={segment.label}
            style={{ width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}
