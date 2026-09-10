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
import { useEffect, useState, useSyncExternalStore } from "react"

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
import { NotificationBell } from "@/features/notifications/components/notification-bell"
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
const sidebarListeners = new Set<() => void>()
let sidebarCollapsedCache: boolean | undefined

function readStoredSidebarCollapsed() {
  if (sidebarCollapsedCache !== undefined) return sidebarCollapsedCache
  try {
    sidebarCollapsedCache =
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true"
  } catch {
    sidebarCollapsedCache = false
  }
  return sidebarCollapsedCache
}

function subscribeSidebarCollapsed(onStoreChange: () => void) {
  sidebarListeners.add(onStoreChange)
  return () => {
    sidebarListeners.delete(onStoreChange)
  }
}

function storeSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsedCache = collapsed
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed))
  } catch {}
  for (const listener of sidebarListeners) listener()
}

/**
 * The collapsed preference lives in localStorage, which the server cannot see.
 * Reading it through an external store lets the server render the expanded
 * shell and React swap in the stored value on hydration, with no mismatch.
 */
function useSidebarCollapsed() {
  return useSyncExternalStore(
    subscribeSidebarCollapsed,
    readStoredSidebarCollapsed,
    () => false,
  )
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
        "group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary"
          aria-hidden="true"
        />
      )}
      <Icon className={cn("size-4 shrink-0", isActive && "text-sidebar-primary")} />
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
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
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
            <div className="truncate text-sm font-semibold leading-tight text-sidebar-foreground">
              {instance.name}
            </div>
            <div className="truncate text-xs text-sidebar-foreground/45">
              {instance.description}
            </div>
          </div>
        )}
        {onToggleCollapsed && (
          <button
            aria-label={toggleLabel}
            title={toggleLabel}
            onClick={onToggleCollapsed}
            className={cn(
              "hidden size-7 items-center justify-center rounded-md text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:flex",
              collapsed && "ml-0",
            )}
          >
            <ToggleIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-sidebar-border" />

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
          <div className="mx-3 h-px bg-sidebar-border" />
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
          <div className="mx-3 h-px bg-sidebar-border" />
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
          "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150",
          "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/60",
          collapsed && "justify-center px-0",
        )}
      >
        <Search className="size-4 shrink-0" />
        {!collapsed ? (
          <>
            <span className="flex-1 text-left">{t("forms.search")}</span>
            <kbd className="rounded border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 text-[10px] leading-none text-sidebar-foreground/45">
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
  const sidebarCollapsed = useSidebarCollapsed()

  function toggleSidebarCollapsed() {
    storeSidebarCollapsed(!sidebarCollapsed)
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
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-5">
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
            <div className="truncate text-sm font-semibold text-foreground">
              {instance.name}
            </div>
          </div>

          <div className="hidden flex-1 md:block" />
          <NotificationBell />
        </header>

        {/* ── Page content ── */}
        <main
          className={cn("mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:py-8", contentClassName)}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
