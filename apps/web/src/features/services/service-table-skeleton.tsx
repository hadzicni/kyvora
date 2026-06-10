import { Skeleton } from "@/components/ui/skeleton";

export function ServiceTableSkeleton() {
  return (
    <div className="grid gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton className="h-14 w-full" key={index} />
      ))}
    </div>
  );
}
