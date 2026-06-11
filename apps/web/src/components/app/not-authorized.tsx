"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotAuthorized({
  description = "Your permissions do not allow access to this area.",
}: {
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-300" />
          Not authorized
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Button asChild variant="outline">
          <Link href="/">Back to Overview</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
