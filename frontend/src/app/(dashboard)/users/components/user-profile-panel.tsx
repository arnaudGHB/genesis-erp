"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

type User = {
  id: string
  name: string | null
  email: string
  roles: { id: string; name: string }[]
  createdAt: string
}

interface UserProfilePanelProps {
  user: User
  onClose: () => void
  onEdit?: (user: User) => void
}

export function UserProfilePanel({ user, onClose, onEdit }: UserProfilePanelProps) {
  const name = user.name || "N/A"
  const initials = name !== "N/A" ? name.split(" ").map(n => n[0]).join("").toUpperCase() : "NA"

  return (
    <div className="w-96 border-l bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-semibold">Profil Utilisateur</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-6">
        {/* Header du profil */}
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt={name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role.id} variant="secondary">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Aucun rôle</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => onEdit?.(user)} className="flex-1">
            Modifier
          </Button>
        </div>

        <Separator className="mb-6" />

        {/* Onglets d'informations détaillées */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">{user.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Créé le:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Statut:</span>
                  <Badge variant="default">Actif</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activité récente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité à implémenter : historique des connexions, actions effectuées, etc.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permissions par rôle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <div key={role.id} className="border rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2">{role.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Permissions détaillées à implémenter
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune permission assignée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}