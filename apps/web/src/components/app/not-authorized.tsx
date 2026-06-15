"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function NotAuthorized({
  description,
}: {
  description?: string;
}) {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-300" />
          {t("authz.notAuthorized")}
        </CardTitle>
        <CardDescription>
          {description ?? t("authz.defaultDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Button asChild variant="outline">
          <Link href="/">{t("authz.backToOverview")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
