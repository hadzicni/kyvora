import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AgentTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[
            "Name",
            "Server",
            "Hostname",
            "Version",
            "Status",
            "Last seen",
            "Registered",
          ].map((heading) => (
            <TableHead key={heading}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: 7 }).map((__, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-5 w-full max-w-36" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
