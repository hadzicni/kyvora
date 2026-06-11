"use client"

import { LogOut, UserCircle } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supportedLocales } from "@/i18n/config"
import { useLocalePreference } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"

async function logout() {
  await fetch("/api/session/logout", { method: "POST" }).catch(() => {})
  await signOut({ callbackUrl: "/login" })
}

function getInitials(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.trim() || "K"
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations()
  const { locale, setLocale } = useLocalePreference()
  const { data: session, status } = useSession()
  const initials = getInitials(session?.user.displayName, session?.user.email)

  function handleLogout() {
    toast.info(t("auth.signingOut"))
    void logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open user menu"
          title={collapsed ? session?.user.displayName || session?.user.email : undefined}
          className={cn(
            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors hover:bg-white/6",
            collapsed && "justify-center px-0",
          )}
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              boxShadow: "0 0 12px rgba(99,102,241,0.35)",
            }}
          >
            {initials}
          </span>

          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-white/80">
                {status === "loading"
                  ? t("common.loadingSession")
                  : session?.user.displayName ||
                    session?.user.email ||
                    t("common.signedIn")}
              </span>
              <span className="block truncate text-xs text-white/35">
                {session?.user.email || t("common.authenticatedSession")}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="right" className="w-64">
        <DropdownMenuLabel>
          <div className="min-w-0 space-y-0.5">
            <div className="truncate text-sm font-medium text-foreground">
              {session?.user.displayName || session?.user.email || t("common.signedIn")}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {session?.user.email || t("common.authenticatedSession")}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {t("common.language")}
        </DropdownMenuLabel>

        {supportedLocales.map((supportedLocale) => (
          <DropdownMenuItem
            key={supportedLocale}
            onClick={() => setLocale(supportedLocale)}
          >
            <span className="w-4 text-xs">{locale === supportedLocale ? "✓" : ""}</span>
            {supportedLocale === "en" ? t("common.english") : t("common.german")}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserCircle className="size-4" />
            {t("navigation.profile")}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut className="size-4" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
