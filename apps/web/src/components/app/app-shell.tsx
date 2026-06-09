"use client";

import {
  Activity,
  Bot,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Server,
  UserCircle
} from "lucide-react";
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
import { getInstanceSettings } from "@/lib/api/settings";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/servers",
    label: "Servers",
    icon: Server,
  },
  {
    href: "/agents",
    label: "Agents",
    icon: Bot,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Activity,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
  {
    href: "/help",
    label: "Help",
    icon: CircleHelp,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserCircle,
  },
];

async function logout() {
  toast.info("Signing out...");

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

function SidebarContent() {
  const pathname = usePathname();
  const settingsQuery = useSettings();
  const instance = getInstanceSettings(settingsQuery.data);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-5">
          <span className="flex size-8 items-center justify-center">
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
        <div>
          <div className="max-w-44 truncate text-sm font-semibold leading-tight">
            {instance.name}
          </div>
          <div className="max-w-44 truncate text-xs text-muted-foreground">
            {instance.description}
          </div>
        </div>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive &&
                  "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-md bg-muted/40 p-3">
          <Activity className="size-4 text-emerald-400" />
          <div className="min-w-0">
            <div className="text-xs font-medium">API status</div>
            <div className="truncate text-xs text-muted-foreground">
              Inventory endpoint ready
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandPalette() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const serversQuery = useServers({ q: search, size: 8 });
  const agentsQuery = useAgents({ size: 50 });
  const servers = serversQuery.data?.content ?? [];
  const agents = agentsQuery.data?.content ?? [];

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
        <span className="flex-1 text-left">Search navigation</span>
        <span className="rounded border bg-background px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
          Ctrl K
        </span>
      </Button>
      <CommandDialog
        className="sm:max-w-xl"
        description="Search navigation, servers, and agents."
        onOpenChange={setOpen}
        open={open}
        title="Command palette"
      >
        <Command shouldFilter>
          <CommandInput
            autoFocus
            onValueChange={setSearch}
            placeholder="Search Kyvora..."
            value={search}
          />
          <CommandList>
            <CommandEmpty>
              {serversQuery.isLoading || agentsQuery.isLoading
                ? "Loading results..."
                : "No results found."}
            </CommandEmpty>
            <CommandGroup heading="Navigation">
              {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <CommandItem
                      data-checked={isActive}
                      key={item.href}
                      onSelect={() => navigateTo(item.href)}
                      value={`${item.label} ${item.href}`}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Servers">
              {serversQuery.isLoading ? (
                <CommandItem disabled value="loading servers">
                  Loading servers...
                </CommandItem>
              ) : null}
              {serversQuery.isError ? (
                <CommandItem disabled value="unable to load servers">
                  Unable to load servers.
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
            <CommandGroup heading="Agents">
              {agentsQuery.isLoading ? (
                <CommandItem disabled value="loading agents">
                  Loading agents...
                </CommandItem>
              ) : null}
              {agentsQuery.isError ? (
                <CommandItem disabled value="unable to load agents">
                  Unable to load agents.
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
  const { data: session, status } = useSession();
  const settingsQuery = useSettings();
  const instance = getInstanceSettings(settingsQuery.data);
  const initials = getInitials(session?.user.displayName, session?.user.email);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-sidebar-border bg-sidebar md:block">
        <SidebarContent />
      </aside>
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                aria-label="Open navigation"
                className="md:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-72 p-0" side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
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
                  ? "Loading session"
                  : session?.user.displayName || session?.user.email || "Signed in"}
              </div>
              <div className="truncate">
                {session?.user.role || "Authenticated"}
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
                        "Signed in"}
                    </div>
                    <div className="truncate text-xs">
                      {session?.user.email || "Authenticated session"}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserCircle className="size-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void logout()} variant="destructive">
                  <LogOut className="size-4" />
                  Sign out
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
