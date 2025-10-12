"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  Users,
  AlertTriangle,
  Database,
  Activity,
  Server,
  HardDrive,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const recentActivity = [
    {
      id: "1",
      type: "system",
      description: "System activity will appear here",
      timestamp: "Recent",
      severity: "info",
    },
  ]

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "warning" | "destructive" | "success"> = {
      info: "default",
      warning: "warning",
      error: "destructive",
      success: "success",
    }
    return <Badge variant={variants[severity] || "default"}>{severity}</Badge>
  }

  return (
    <div className="flex flex-col">
      <Header title="Super Admin Dashboard" />
      
      <div className="flex-1 space-y-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                System users
              </p>
            </CardContent>
          </Card>

          {/* Total Reports */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reports
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                All reports
              </p>
            </CardContent>
          </Card>

          {/* Active Incidents */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Incidents
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>

          {/* Database Size */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Database Size
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground mt-1">
                Storage used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health and Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Uptime</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">-</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">API Requests</span>
                  </div>
                  <span className="text-sm font-bold">-</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Storage</span>
                  </div>
                  <span className="text-sm font-bold">-</span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-muted-foreground">
                      All systems operational
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                    <div>{getSeverityBadge(activity.severity)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Create Admin</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Database className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Database Backup</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Activity className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Analytics</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-accent transition-colors">
                <Server className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">System Settings</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

