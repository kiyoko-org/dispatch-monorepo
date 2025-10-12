"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Settings,
  Database,
  BarChart3,
  Key,
  Shield,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Admin Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Database",
    href: "/admin/database",
    icon: Database,
  },
  {
    name: "API Keys",
    href: "/admin/api-keys",
    icon: Key,
  },
  {
    name: "System Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-purple-900 to-indigo-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-purple-800">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-purple-300" />
          <div>
            <h1 className="text-lg font-bold">Super Admin</h1>
            <p className="text-xs text-purple-300">Dispatch Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-800 text-white shadow-lg"
                      : "text-purple-200 hover:bg-purple-800/50 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-purple-800 p-4">
        <div className="text-xs text-purple-300">
          <div className="font-medium">System Status</div>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  )
}

