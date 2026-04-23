import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
  Zap,
  Shield,
  Package,
  ShoppingBag,
  Wrench,
  TrendingUp,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_GROUPS = [
  {
    group: "Workspace",
    items: [
      { icon: Home,          label: "Dashboard",     href: "/dashboard" },
      { icon: ClipboardList, label: "Inspections",   href: "/inspections" },
      { icon: Building2,     label: "Properties",    href: "/properties" },
      { icon: CheckSquare,   label: "Review Queue",  href: "/review-queue", badge: "PM" },
    ],
  },
  {
    group: "Property Records",
    items: [
      { icon: Package,    label: "Chattels",   href: "/chattels" },
      { icon: ShoppingBag, label: "Inventory",  href: "/inventory" },
      { icon: Shield,     label: "Healthy Homes", href: "/healthy-homes", badge: "HH" },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { icon: Wrench,    label: "Maint. Plan",   href: "/maintenance-plan" },
      { icon: TrendingUp, label: "Rent Appraisal", href: "/rental-appraisal" },
      { icon: Sparkles,  label: "Improvements",  href: "/improvements" },
      { icon: FileText,  label: "Reports",        href: "/reports" },
    ],
  },
  {
    group: "System",
    items: [
      { icon: Globe,         label: "Integrations", href: "/integrations" },
      { icon: MessageSquare, label: "Fixx",         href: "/fixx", badge: "AI" },
      { icon: Settings,      label: "Settings",     href: "/settings" },
    ],
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--cream)" }}
      >
        <div className="text-center">
          <div
            className="font-anton text-5xl mb-3"
            style={{ color: "var(--black)", letterSpacing: "-0.01em", lineHeight: 1 }}
          >
            FXD<span style={{ color: "var(--pink)" }}>.</span>
          </div>
          <div
            className="font-archivo text-xs tracking-widest uppercase"
            style={{ color: "var(--muted)" }}
          >
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center texture-dots fxd-glow"
        style={{ background: "var(--cream)" }}
      >
        <div className="text-center max-w-sm px-6">
          <div
            className="font-anton mb-2"
            style={{
              fontSize: "clamp(64px,14vw,96px)",
              color: "var(--black)",
              letterSpacing: "-0.015em",
              lineHeight: 0.88,
            }}
          >
            FXD<span style={{ color: "var(--pink)" }}>.</span>
          </div>
          <div
            className="font-archivo text-xs tracking-widest uppercase mb-2"
            style={{ color: "var(--pink)" }}
          >
            Property Inspection Platform
          </div>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            The AI sidekick for New Zealand property managers. Sign in to access your workspace.
          </p>
          <a
            href={getLoginUrl()}
            className="fxd-btn fxd-btn-pink"
            style={{ justifyContent: "center", width: "100%", display: "flex" }}
          >
            <Zap size={14} />
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  const SidebarNav = () => (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--black)" }}
    >
      {/* Logo */}
      <div
        className="px-5 py-4 flex-shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <Link href="/dashboard">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--pink)" }}
            >
              <span
                className="font-anton text-sm"
                style={{ color: "var(--white)", letterSpacing: "0.02em" }}
              >
                FX
              </span>
            </div>
            <div>
              <div
                className="font-anton text-xl leading-none"
                style={{ color: "var(--white)", letterSpacing: "0.02em" }}
              >
                FXD<span style={{ color: "var(--pink)" }}>.</span>
              </div>
              <div
                className="font-archivo leading-none mt-0.5"
                style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.18em", textTransform: "uppercase" }}
              >
                Inspect360
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map(({ group, items }) => (
          <div key={group} className="mb-4">
            <div
              className="font-archivo px-2 mb-1.5"
              style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}
            >
              {group}
            </div>
            {items.map((item) => {
              const active =
                location === item.href ||
                (item.href !== "/dashboard" && location.startsWith(item.href + "/")) ||
                (item.href === "/dashboard" && location === "/dashboard");
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center gap-2.5 px-3 py-2 rounded-sm mb-0.5 cursor-pointer transition-all duration-100 group"
                    style={{
                      background: active ? "var(--pink)" : "transparent",
                      color: active ? "var(--white)" : "rgba(255,255,255,0.55)",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
                      if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                    }}
                  >
                    <Icon size={14} />
                    <span
                      className="font-archivo flex-1"
                      style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}
                    >
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className="font-archivo px-1.5 py-0.5 rounded-sm"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: "var(--yellow)",
                          color: "var(--black)",
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="px-4 py-3 border-t flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-archivo text-xs"
            style={{ background: "var(--pink)", color: "var(--white)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="font-archivo truncate"
              style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--white)" }}
            >
              {user?.name || "Inspector"}
            </div>
            <div
              className="truncate"
              style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}
            >
              {user?.email || ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--pink)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
        >
          <LogOut size={12} />
          <span
            className="font-archivo"
            style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--cream)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(10,10,10,0.65)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 flex flex-col shadow-2xl">
            <SidebarNav />
            <button
              className="absolute top-4 right-3 p-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={15} />
            </button>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ background: "var(--black)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-sm"
            style={{ color: "var(--white)" }}
          >
            <Menu size={20} />
          </button>
          <div
            className="font-anton text-xl"
            style={{ color: "var(--white)", letterSpacing: "0.02em" }}
          >
            FXD<span style={{ color: "var(--pink)" }}>.</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
