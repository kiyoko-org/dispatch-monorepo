"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Activity,
} from "lucide-react"
import { formatDateTime } from "@/lib/utils"

export default function APIKeysPage() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // API keys will be loaded from database
  const apiKeys: any[] = []

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }))
  }

  const maskKey = (key: string) => {
    return key.slice(0, 12) + "..." + key.slice(-12)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // In a real app, show a toast notification
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="destructive">Revoked</Badge>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="API Keys Management" />
      
      <div className="flex-1 space-y-6 p-6">
        {/* API Keys Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total API Keys
              </CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">
                API keys
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Requests
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Revoked Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Inactive keys</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Last Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">-</div>
              <p className="text-xs text-muted-foreground">Most recent request</p>
            </CardContent>
          </Card>
        </div>

        {/* Create New Key */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create New API Key</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Key Name</label>
                <Input placeholder="Enter key name..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Permissions</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Read</Button>
                  <Button variant="outline" size="sm">Write</Button>
                  <Button variant="outline" size="sm">Delete</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Active API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No API keys found. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey: any) => (
                <div key={apiKey.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        {getStatusBadge(apiKey.status)}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm bg-secondary p-2 rounded">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">
                          {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Created</p>
                      <p className="font-medium">{formatDateTime(apiKey.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Last Used</p>
                      <p className="font-medium">{formatDateTime(apiKey.lastUsed)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Requests</p>
                      <p className="font-medium">{apiKey.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Permissions</p>
                      <div className="flex gap-1 flex-wrap">
                        {apiKey.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

