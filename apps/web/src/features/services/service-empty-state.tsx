import { Cable } from "lucide-react";
import { useTranslations } from "next-intl";

export function ServiceEmptyState() {
  const t = useTranslations("services");

  return (
    <div className="grid place-items-center rounded-lg border border-dashed py-12 text-center">
      <div className="grid max-w-md gap-3">
        <Cable className="mx-auto size-8 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{t("emptyTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    </div>
  );
}
