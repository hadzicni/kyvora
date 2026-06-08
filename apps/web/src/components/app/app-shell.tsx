"use client";

import {
  Activity,
  Bot,
  Database,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Server,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Database className="size-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Kyvora</div>
          <div className="text-xs text-muted-foreground">Operations</div>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

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
            <div className="text-sm font-medium">Infrastructure dashboard</div>
            <div className="text-xs text-muted-foreground">
              Server inventory and operating state
            </div>
          </div>

          <div className="hidden h-9 w-full max-w-xs items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground xl:flex">
            <Search className="size-4" />
            <span>Search infrastructure</span>
          </div>

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
            <Button
              aria-label="Sign out"
              onClick={async () => {
                await fetch("/api/session/logout", { method: "POST" }).catch(() => {
                  // The local session should still be cleared even if backend logout fails.
                });

                await signOut({ callbackUrl: "/login" });
              }}
              size="icon"
              variant="outline"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
