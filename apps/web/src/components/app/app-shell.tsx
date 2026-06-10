"use client";

import {
  Activity,
  Bot,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Server,
  UserCircle,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAgents } from "@/features/agents/use-agents";
import { useSettings } from "@/features/settings/use-settings";
import { useServers } from "@/features/servers/use-servers";
import { supportedLocales } from "@/i18n/config";
import { useLocalePreference } from "@/i18n/locale-provider";
import { getInstanceSettings } from "@/lib/api/settings";
import { canManageSettings, canManageUsers } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey:
    | "overview"
    | "servers"
    | "networkMap"
    | "agents"
    | "activity"
    | "users"
    | "settings"
    | "help"
    | "profile";
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: (role: string | undefined) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    labelKey: "overview",
    icon: LayoutDashboard,
  },
  {
    href: "/servers",
    labelKey: "servers",
    icon: Server,
  },
  {
    href: "/network-map",
    labelKey: "networkMap",
    icon: Network,
  },
  {
    href: "/agents",
    labelKey: "agents",
    icon: Bot,
  },
  {
    href: "/activity",
    labelKey: "activity",
    icon: Activity,
  },
  {
    href: "/users",
    labelKey: "users",
    icon: Users,
    requiredPermission: canManageUsers,
  },
  {
    href: "/settings",
    labelKey: "settings",
    icon: Settings,
    requiredPermission: canManageSettings,
  },
  {
    href: "/help",
    labelKey: "help",
    icon: CircleHelp,
  },
  {
    href: "/profile",
    labelKey: "profile",
    icon: UserCircle,
  },
];

const SIDEBAR_COLLAPSED_STORAGE_KEY = "kyvora.sidebar.collapsed";
let sidebarCollapsedCache: boolean | undefined;

function readStoredSidebarCollapsed() {
  if (sidebarCollapsedCache !== undefined) {
    return sidebarCollapsedCache;
  }

  if (typeof window === "undefined") {
    return false;
  }

  try {
    sidebarCollapsedCache =
      window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
    return sidebarCollapsedCache;
  } catch {
    return false;
  }
}

function storeSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsedCache = collapsed;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(collapsed)
    );
  } catch {
    // The in-memory state still keeps navigation behavior correct for this session.
  }
}

async function logout() {
  await fetch("/api/session/logout", { method: "POST" }).catch(() => {
    // The local session should still be cleared even if backend logout fails.
  });

  await signOut({ callbackUrl: "/login" });
}

function getInitials(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.trim() || "K";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function SidebarContent({
  collapsed = false,
  onToggleCollapsed,
}: {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const { data: session } = useSession();
  const mayManageSettings = canManageSettings(session?.user.role);
  const settingsQuery = useSettings(mayManageSettings);
  const instance = getInstanceSettings(settingsQuery.data);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredPermission || item.requiredPermission(session?.user.role)
  );
  const toggleLabel = collapsed
    ? t("navigation.expandSidebar")
    : t("navigation.collapseSidebar");

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 items-center gap-3 px-5",
          collapsed && "justify-center px-3"
        )}
      >
        {!collapsed ? (
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
        ) : null}
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <div className="max-w-44 truncate text-sm font-semibold leading-tight">
              {instance.name}
            </div>
            <div className="max-w-44 truncate text-xs text-muted-foreground">
              {instance.description}
            </div>
          </div>
        ) : null}
        {onToggleCollapsed ? (
          <Button
            aria-label={toggleLabel}
            className="hidden size-8 shrink-0 md:inline-flex"
            onClick={onToggleCollapsed}
            size="icon"
            title={toggleLabel}
            variant="ghost"
          >
            <ToggleIcon className="size-4" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <nav className={cn("flex flex-1 flex-col gap-1 p-3", collapsed && "px-2")}>
        {visibleNavItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const label = t(`navigation.${item.labelKey}`);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? label : <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className={cn("border-t border-sidebar-border p-4", collapsed && "p-3")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-md bg-muted/40 p-3",
            collapsed && "justify-center p-2"
          )}
          title={
            collapsed
              ? `${t("navigation.apiStatus")}: ${t("navigation.inventoryEndpointReady")}`
              : undefined
          }
        >
          <Activity className="size-4 shrink-0 text-emerald-400" />
          {!collapsed ? (
            <div className="min-w-0">
              <div className="text-xs font-medium">
                {t("navigation.apiStatus")}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {t("navigation.inventoryEndpointReady")}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CommandPalette() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const serversQuery = useServers({ q: search, size: 8 });
  const agentsQuery = useAgents({ size: 50 });
  const servers = serversQuery.data?.content ?? [];
  const agents = agentsQuery.data?.content ?? [];
  const { data: session } = useSession();
  const visibleNavItems = navItems.filter(
    (item) =>
      !item.requiredPermission || item.requiredPermission(session?.user.role)
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function navigateTo(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button
        className="hidden h-9 w-full max-w-xs justify-start gap-2 rounded-md border bg-muted/30 px-3 text-sm font-normal text-muted-foreground xl:flex"
        onClick={() => setOpen(true)}
        variant="ghost"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">{t("forms.search")}</span>
        <span className="rounded border bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
          Ctrl K
        </span>
      </Button>
      <CommandDialog
        className="sm:max-w-xl"
        description={`${t("navigation.navigation")}, ${t("navigation.servers")}, ${t("navigation.agents")}`}
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
              {serversQuery.isLoading || agentsQuery.isLoading
                ? `${t("common.loading")}...`
                : "No results found."}
            </CommandEmpty>
            <CommandGroup heading={t("navigation.navigation")}>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const label = t(`navigation.${item.labelKey}`);
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("navigation.servers")}>
              {serversQuery.isLoading ? (
                <CommandItem disabled value="loading servers">
                  {t("servers.loadingInventory")}
                </CommandItem>
              ) : null}
              {serversQuery.isError ? (
                <CommandItem disabled value="unable to load servers">
                  {t("servers.errorTitle")}
                </CommandItem>
              ) : null}
              {servers.map((server) => (
                <CommandItem
                  key={server.id}
                  onSelect={() =>
                    navigateTo(`/servers/${encodeURIComponent(server.id)}`)
                  }
                  value={`${server.name} ${server.hostname} ${server.ipAddress} ${server.operatingSystem} ${server.tags.join(" ")}`}
                >
                  <Server className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{server.name}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {server.hostname}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("navigation.agents")}>
              {agentsQuery.isLoading ? (
                <CommandItem disabled value="loading agents">
                  {t("agents.loadingAgents")}
                </CommandItem>
              ) : null}
              {agentsQuery.isError ? (
                <CommandItem disabled value="unable to load agents">
                  {t("agents.errorTitle")}
                </CommandItem>
              ) : null}
              {agents.map((agent) => (
                <CommandItem
                  key={agent.id}
                  onSelect={() => navigateTo("/agents")}
                  value={`${agent.name} ${agent.hostname} ${agent.version} ${agent.status}`}
                >
                  <Bot className="size-4" />
                  <span className="min-w-0 flex-1 truncate">{agent.name}</span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {agent.hostname}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const { locale, setLocale } = useLocalePreference();
  const { data: session, status } = useSession();
  const mayManageSettings = canManageSettings(session?.user.role);
  const settingsQuery = useSettings(mayManageSettings);
  const instance = getInstanceSettings(settingsQuery.data);
  const initials = getInitials(session?.user.displayName, session?.user.email);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    readStoredSidebarCollapsed
  );

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((current) => {
      const nextCollapsed = !current;
      storeSidebarCollapsed(nextCollapsed);
      return nextCollapsed;
    });
  }

  function handleLogout() {
    toast.info(t("auth.signingOut"));
    void logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:block",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />
      </aside>
      <div
        className={cn(
          "min-h-screen transition-[padding-left] duration-200",
          sidebarCollapsed ? "md:pl-16" : "md:pl-64"
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
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
            <SheetContent className="w-72 p-0" side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>{t("navigation.navigation")}</SheetTitle>
              </SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{instance.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {instance.description}
            </div>
          </div>

          <CommandPalette />

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden min-w-0 text-right text-xs text-muted-foreground sm:block">
              <div className="truncate font-medium text-foreground">
                {status === "loading"
                  ? t("common.loadingSession")
                  : session?.user.displayName ||
                    session?.user.email ||
                    t("common.signedIn")}
              </div>
              <div className="truncate">
                {session?.user.role
                  ? t(`roles.${session.user.role}`)
                  : t("common.authenticated")}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Open user menu" size="icon" variant="outline">
                  <Avatar size="sm">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="min-w-0 space-y-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {session?.user.displayName ||
                        session?.user.email ||
                        t("common.signedIn")}
                    </div>
                    <div className="truncate text-xs">
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
                    <span className="w-4 text-xs">
                      {locale === supportedLocale ? "✓" : ""}
                    </span>
                    {supportedLocale === "en"
                      ? t("common.english")
                      : t("common.german")}
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
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
