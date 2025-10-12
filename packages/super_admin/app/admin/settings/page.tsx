"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Globe,
  Bell,
  Mail,
  Database,
  Shield,
  Save,
} from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col">
      <Header title="System Settings" />
      
      <div className="flex-1 space-y-6 p-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>General Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Application Name
              </label>
              <Input defaultValue="Dispatch Platform" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Default Language
              </label>
              <Select defaultValue="en">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Time Zone
              </label>
              <Select defaultValue="utc">
                <option value="utc">UTC</option>
                <option value="pst">Pacific Time</option>
                <option value="est">Eastern Time</option>
                <option value="gmt">GMT</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Date Format
              </label>
              <Select defaultValue="mdy">
                <option value="mdy">MM/DD/YYYY</option>
                <option value="dmy">DD/MM/YYYY</option>
                <option value="ymd">YYYY-MM-DD</option>
              </Select>
            </div>

            <Button className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              Save General Settings
            </Button>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Configuration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                SMTP Host
              </label>
              <Input placeholder="smtp.example.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  SMTP Port
                </label>
                <Input type="number" defaultValue="587" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Encryption
                </label>
                <Select defaultValue="tls">
                  <option value="tls">TLS</option>
                  <option value="ssl">SSL</option>
                  <option value="none">None</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                From Email
              </label>
              <Input type="email" placeholder="noreply@dispatch.com" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                From Name
              </label>
              <Input placeholder="Dispatch Platform" />
            </div>

            <Button className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for important events
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Send push notifications to mobile apps
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">SMS Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Send SMS for emergency alerts
                </p>
              </div>
              <Badge variant="default">Disabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Slack Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Send notifications to Slack channels
                </p>
              </div>
              <Badge variant="default">Disabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Backup Frequency
              </label>
              <Select defaultValue="daily">
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Backup Retention (days)
              </label>
              <Input type="number" defaultValue="30" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Auto-Optimize Tables
              </label>
              <Select defaultValue="weekly">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="never">Never</option>
              </Select>
            </div>

            <Button className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              Save Database Settings
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Session Timeout (minutes)
              </label>
              <Input type="number" defaultValue="30" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Max Failed Login Attempts
              </label>
              <Input type="number" defaultValue="5" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Password Min Length
              </label>
              <Input type="number" defaultValue="8" />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Require Password Change</h4>
                <p className="text-sm text-muted-foreground">
                  Force users to change password every 90 days
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for all admin accounts
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <Button className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              Save Security Settings
            </Button>
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>API Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rate Limit (requests per minute)
              </label>
              <Input type="number" defaultValue="1000" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                API Version
              </label>
              <Select defaultValue="v2">
                <option value="v1">v1 (Legacy)</option>
                <option value="v2">v2 (Current)</option>
                <option value="v3">v3 (Beta)</option>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">API Documentation</h4>
                <p className="text-sm text-muted-foreground">
                  Public API documentation access
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <Button className="mt-4">
              <Save className="h-4 w-4 mr-2" />
              Save API Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

