import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Link2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  Bell,
  Zap,
  Wallet,
} from "lucide-react";
import { cn, getInitials } from "../lib/utils";
import { useAuthStore } from "../stores/auth.store";
import { authService } from "../services/api";
import { capitalizeFirstLetters } from "@/utils/utils";

const NAV = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Products", icon: Package, to: "/dashboard/products" },
  { label: "Customers", icon: Users, to: "/dashboard/customers" },
  { label: "Transactions", icon: CreditCard, to: "/dashboard/transactions" },
  { label: "Payment Links", icon: Link2, to: "/dashboard/payment-links" },
  { label: "Wallet", icon: Wallet, to: "/dashboard/wallet" },
  { label: "Analytics", icon: BarChart3, to: "/dashboard/analytics" },
  { label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export const DashboardLayout: React.FC = () => {
  const { user, business, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      /* ignore */
    }
    logout();
    navigate("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={cn(
        "flex flex-col bg-gray-950 text-white h-full",
        mobile ? "w-full" : "w-64 min-w-[16rem]",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">PayCycle</span>
      </div>

      {/* Business badge */}
      {business && (
        <div className="mx-3 mt-3 px-3 py-2.5 bg-gray-900 rounded-lg border border-gray-800">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            Workspace
          </p>
          <p className="text-sm text-white font-semibold mt-0.5 truncate">
            {capitalizeFirstLetters(business?.name)}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800",
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-gray-800">
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Sign out</span>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                {user?.image ? (
                  <img
                    src={user?.image}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold"
                  />
                ) : (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                    {user ? getInitials(user.firstName, user.lastName) : "U"}
                  </div>
                )}

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-10 py-1">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/dashboard/settings");
                    }}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
