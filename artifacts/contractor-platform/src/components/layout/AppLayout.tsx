import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Package, 
  Users, 
  Truck,
  Settings,
  Bell,
  Menu,
  X,
  FileCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@workspace/replit-auth-web";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppLayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileCheck },
  { href: "/estimates", label: "Estimates", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/materials", label: "Materials", icon: Package },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
];

function SidebarContent({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="h-16 flex items-center px-6 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
            <span className="font-display font-bold text-primary-foreground text-xl">C</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            ProBuilder
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href ||
            (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border flex-shrink-0">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${
            location === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Settings className={`w-5 h-5 ${location === "/settings" ? "text-primary" : "text-muted-foreground"}`} />
          Settings
        </Link>
      </div>
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.firstName
      ? user.firstName.slice(0, 2)
      : user?.username?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">

      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border relative z-10">
        <SidebarContent location={location} />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out md:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent location={location} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Texture Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/dashboard-bg.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border relative z-10">
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-display font-bold text-lg">ProBuilder</span>
          </div>

          <div className="hidden md:flex flex-1" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-secondary transition-colors outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
                  {/* Avatar */}
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-primary leading-none">{initials}</span>
                    )}
                  </div>
                  {/* Name */}
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-semibold text-foreground leading-tight max-w-[110px] truncate">
                      {user?.firstName
                        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
                        : user?.username ?? "User"}
                    </span>
                    {user?.username && (
                      <span className="text-[11px] text-muted-foreground leading-tight">@{user.username}</span>
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
                {/* Profile Card */}
                <div className="p-4 bg-secondary/30 border-b border-border flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-base font-bold text-primary">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.firstName || user?.username || "User"}{user?.lastName ? ` ${user.lastName}` : ""}
                    </p>
                    {user?.username && (
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    )}
                    {user?.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg px-3 py-2"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Log out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto relative z-10 no-print">
          {children}
        </div>

        {/* Print Content Area */}
        <div className="print-only">
          {children}
        </div>
      </main>
    </div>
  );
}
