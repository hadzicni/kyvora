"use client"

import {
  Activity,
  Bot,
  Cable,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Server,
  Settings,
  UserCircle,
  Users,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { UserMenu } from "@/components/app/user-menu"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useGlobalSearch } from "@/features/search/use-global-search"
import { useSettings } from "@/features/settings/use-settings"
import type { SearchResult, SearchResultType } from "@/lib/api/search"
import { getInstanceSettings } from "@/lib/api/settings"
import {
  canAccessUserManagement,
  canReadAgents,
  canReadAuditLogs,
  canReadDashboard,
  canReadNetworkMap,
  canReadServers,
  canReadServices,
  canReadSettings,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  labelKey:
    | "overview"
    | "servers"
    | "services"
    | "networkMap"
    | "agents"
    | "activity"
    | "users"
    | "settings"
    | "help"
    | "profile"
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: (permissions: readonly string[] | undefined) => boolean
}

const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "overview",
    icon: LayoutDashboard,
    requiredPermission: canReadDashboard,
  },
  {
    href: "/servers",
    labelKey: "servers",
    icon: Server,
    requiredPermission: canReadServers,
  },
  {
    href: "/services",
    labelKey: "services",
    icon: Cable,
    requiredPermission: canReadServices,
  },
  {
    href: "/network-map",
    labelKey: "networkMap",
    icon: Network,
    requiredPermission: canReadNetworkMap,
  },
  { href: "/agents", labelKey: "agents", icon: Bot, requiredPermission: canReadAgents },
  {
    href: "/activity",
    labelKey: "activity",
    icon: Activity,
    requiredPermission: canReadAuditLogs,
  },
  {
    href: "/users",
    labelKey: "users",
    icon: Users,
    requiredPermission: canAccessUserManagement,
  },
  {
    href: "/settings",
    labelKey: "settings",
    icon: Settings,
    requiredPermission: canReadSettings,
  },
  { href: "/help", labelKey: "help", icon: CircleHelp },
  { href: "/profile", labelKey: "profile", icon: UserCircle },
]

// ─── Bottom nav items (rendered separately below divider) ────────────────────
const bottomNavKeys = new Set(["settings", "help", "profile"])

const SIDEBAR_COLLAPSED_STORAGE_KEY = "kyvora.sidebar.collapsed"
let sidebarCollapsedCache: boolean | undefined

function readStoredSidebarCollapsed() {
  if (sidebarCollapsedCache !== undefined) return sidebarCollapsedCache
  if (typeof window === "undefined") return false
  try {
    sidebarCollapsedCache =
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
    return sidebarCollapsedCache
  } catch {
    return false
  }
}

function storeSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsedCache = collapsed
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  } catch {}
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
  item,
  collapsed,
  pathname,
  label,
}: {
  item: NavItem
  collapsed: boolean
  pathname: string
  label: string
}) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={collapsed ? label : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-all duration-150",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/45 hover:bg-white/6 hover:text-white/80",
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-violet-400"
          aria-hidden="true"
        />
      )}
      <Icon className={cn("size-4 shrink-0", isActive ? "text-violet-400" : "")} />
      {!collapsed ? label : <span className="sr-only">{label}</span>}
    </Link>
  )
}

// ─── Sidebar content ──────────────────────────────────────────────────────────

function SidebarContent({
  collapsed = false,
  onToggleCollapsed,
  userMenu,
}: {
  collapsed?: boolean
  onToggleCollapsed?: () => void
  userMenu?: React.ReactNode
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const { data: session } = useSession()
  const mayReadSettings = canReadSettings(session?.user.permissions)
  const settingsQuery = useSettings(mayReadSettings)
  const instance = getInstanceSettings(settingsQuery.data)
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = collapsed
    ? t("navigation.expandSidebar")
    : t("navigation.collapseSidebar")

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredPermission || item.requiredPermission(session?.user.permissions),
  )
  const mainItems = visibleNavItems.filter((i) => !bottomNavKeys.has(i.labelKey))
  const secondaryItems = visibleNavItems.filter((i) => bottomNavKeys.has(i.labelKey))

  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: "#0d0f14",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo row */}
      <div
        className={cn(
          "flex h-16 items-center gap-3 px-4",
          collapsed && "justify-center px-0",
        )}
      >
        {!collapsed && (
          <span className="flex size-8 shrink-0 items-center justify-center">
            <Image
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              priority
              aria-hidden="true"
              className="size-8"
            />
          </span>
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight text-white">
              {instance.name}
            </div>
            <div className="truncate text-xs text-white/35">{instance.description}</div>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={onToggleCollapsed}
            className={cn(
              "hidden size-7 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/8 hover:text-white/70 md:flex",
              collapsed && "ml-0",
            )}
          >
            <ToggleIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/6" />

      {/* Search bar */}
      <div className={cn("px-3 pt-3", collapsed && "px-2")}>
        <CommandPalette collapsed={collapsed} />
      </div>

      {/* Main nav */}
      <nav
        className={cn("flex flex-1 flex-col gap-0.5 p-3", collapsed && "px-2")}
        aria-label="Main"
      >
        {mainItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            label={t(`navigation.${item.labelKey}`)}
          />
        ))}
      </nav>

      {/* Secondary nav */}
      {secondaryItems.length > 0 && (
        <>
          <div className="mx-3 h-px bg-white/6" />
          <nav
            className={cn("flex flex-col gap-0.5 p-3", collapsed && "px-2")}
            aria-label="Secondary"
          >
            {secondaryItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
                label={t(`navigation.${item.labelKey}`)}
              />
            ))}
          </nav>
        </>
      )}
      {userMenu && (
        <>
          <div className="mx-3 h-px bg-white/6" />
          <div className={cn("p-3", collapsed && "px-2")}>{userMenu}</div>
        </>
      )}
    </div>
  )
}

// ─── Command palette ──────────────────────────────────────────────────────────

function CommandPalette({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { data: session } = useSession()
  const searchQuery = useGlobalSearch(search, open)
  const searchResults = searchQuery.data?.results ?? []
  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredPermission || item.requiredPermission(session?.user.permissions),
  )
  const groupedResults = groupSearchResults(searchResults)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function navigateTo(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={collapsed ? t("forms.search") : undefined}
        className={cn(
          "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm transition-all duration-150",
          collapsed && "justify-center px-0",
          "text-white/45 hover:bg-white/6 hover:text-white/80",
        )}
      >
        <Search className="size-4 shrink-0" />
        {!collapsed ? (
          <>
            <span className="flex-1 text-left">{t("forms.search")}</span>
            <kbd className="rounded border border-white/10 bg-white/6 px-1.5 py-0.5 text-[10px] leading-none text-white/30">
              ⌘K
            </kbd>
          </>
        ) : (
          <span className="sr-only">{t("forms.search")}</span>
        )}
      </button>
      <CommandDialog
        className="sm:max-w-xl"
        description={`${t("navigation.navigation")}, ${t("navigation.servers")}, ${t("navigation.services")}, ${t("navigation.agents")}`}
        onOpenChange={setOpen}
        open={open}
        title="Command palette"
      >
        <Command shouldFilter>
          <CommandInput
            autoFocus
            onValueChange={setSearch}
            placeholder={`${t("forms.search")} Kyvora...`}
            value={search}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim().length > 0 && search.trim().length < 2
                ? "Type at least 2 characters to search resources."
                : searchQuery.isLoading
                  ? `${t("common.loading")}...`
                  : "No results found."}
            </CommandEmpty>
            <CommandGroup heading={t("navigation.navigation")}>
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const label = t(`navigation.${item.labelKey}`)
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                return (
                  <CommandItem
                    data-checked={isActive}
                    key={item.href}
                    onSelect={() => navigateTo(item.href)}
                    value={`${label} ${item.href}`}
                  >
                    <Icon className="size-4" />
                    <span>{label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {searchQuery.isError ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Search">
                  <CommandItem disabled value="unable to load search">
                    Unable to load search results
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
            {search.trim().length >= 2
              ? searchResultTypes.map((type) => {
                  const results = groupedResults[type] ?? []
                  if (results.length === 0) return null
                  return (
                    <SearchResultGroup
                      heading={searchResultHeading(type, t)}
                      key={type}
                      navigateTo={navigateTo}
                      results={results}
                    />
                  )
                })
              : null}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

const searchResultTypes: SearchResultType[] = [
  "SERVER",
  "SERVICE",
  "AGENT",
  "USER",
  "ACTIVITY",
]

function groupSearchResults(results: SearchResult[]) {
  return results.reduce<Partial<Record<SearchResultType, SearchResult[]>>>(
    (groups, result) => {
      const group = groups[result.type] ?? []
      group.push(result)
      groups[result.type] = group
      return groups
    },
    {},
  )
}

function searchResultHeading(
  type: SearchResultType,
  t: ReturnType<typeof useTranslations>,
) {
  switch (type) {
    case "SERVER":
      return t("navigation.servers")
    case "SERVICE":
      return t("navigation.services")
    case "AGENT":
      return t("navigation.agents")
    case "USER":
      return t("navigation.users")
    case "ACTIVITY":
      return t("navigation.activity")
  }
}

function searchResultIcon(type: SearchResultType) {
  switch (type) {
    case "SERVER":
      return Server
    case "SERVICE":
      return Cable
    case "AGENT":
      return Bot
    case "USER":
      return Users
    case "ACTIVITY":
      return Activity
  }
}

function SearchResultGroup({
  heading,
  navigateTo,
  results,
}: {
  heading: string
  navigateTo: (href: string) => void
  results: SearchResult[]
}) {
  return (
    <>
      <CommandSeparator />
      <CommandGroup heading={heading}>
        {results.map((result) => {
          const Icon = searchResultIcon(result.type)
          return (
            <CommandItem
              key={`${result.type}-${result.id}`}
              onSelect={() => navigateTo(result.url)}
              value={`${result.title} ${result.subtitle} ${result.description ?? ""}`}
            >
              <Icon className="size-4" />
              <span className="min-w-0 flex-1 truncate">{result.title}</span>
              <span className="truncate text-xs text-muted-foreground">
                {result.subtitle}
              </span>
            </CommandItem>
          )
        })}
      </CommandGroup>
    </>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────

export function AppShell({
  children,
  contentClassName,
}: {
  children: React.ReactNode
  contentClassName?: string
}) {
  const t = useTranslations()
  const { data: session } = useSession()
  const mayReadSettings = canReadSettings(session?.user.permissions)
  const settingsQuery = useSettings(mayReadSettings)
  const instance = getInstanceSettings(settingsQuery.data)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readStoredSidebarCollapsed)

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const next = !current
      storeSidebarCollapsed(next)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden transition-[width] duration-200 md:block",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
          userMenu={<UserMenu collapsed={sidebarCollapsed} />}
        />
      </aside>

      {/* ── Main area ── */}
      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-200",
          sidebarCollapsed ? "md:pl-16" : "md:pl-64",
        )}
      >
        {/* ── Header ── */}
        <header
          className="sticky top-0 z-10 flex h-14 items-center gap-3 px-4 md:px-5"
          style={{
            background: "rgba(9, 10, 15, 0.85)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label={t("navigation.openNavigation")}
                className="md:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-64 p-0" side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>{t("navigation.navigation")}</SheetTitle>
              </SheetHeader>
              <SidebarContent userMenu={<UserMenu />} />
            </SheetContent>
          </Sheet>

          {/* Instance name — mobile only */}
          <div className="min-w-0 flex-1 md:hidden">
            <div className="truncate text-sm font-semibold text-white">
              {instance.name}
            </div>
          </div>

          <div className="hidden flex-1 md:block" />
        </header>

        {/* ── Page content ── */}
        <main
          className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-6", contentClassName)}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
