"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { logout, user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de votre ERP Genesis Core - Connecté en tant que : {user?.email}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Actualiser
          </Button>
          <Button>Générer Rapport</Button>
          <Button variant="outline" onClick={logout}>
            Déconnexion
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">??</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Produits dans le catalogue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">??</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Articles en stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">??</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 FCFA</div>
            <p className="text-xs text-muted-foreground">
              Valeur totale de l&apos;inventaire
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">??</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs actifs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              ? Nouveau Produit
            </Button>
            <Button className="w-full justify-start" variant="outline">
              ?? Ajuster Stock
            </Button>
            <Button className="w-full justify-start" variant="outline">
              ?? Ajouter Utilisateur
            </Button>
            <Button className="w-full justify-start" variant="outline">
              ?? Consulter Stocks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Dernières actions dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Système initialisé</span>
                <span className="text-xs text-muted-foreground ml-auto">Maintenant</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <span className="text-muted-foreground">Administrateur créé</span>
                <span className="text-xs text-muted-foreground ml-auto">Maintenant</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Système</CardTitle>
            <CardDescription>
              État du système et configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Base de données</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Déconnectée</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Backend</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Indisponible</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Authentification</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Frontend</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">Actif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans Genesis Core ERP !</CardTitle>
          <CardDescription>
            Votre système de gestion pour librairies scolaires est maintenant opérationnel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Pour commencer, vous pouvez :
            </p>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">Naviguer</h4>
                  <p className="text-sm text-muted-foreground">
                    Utilisez la barre latérale pour accéder aux différentes sections
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Gérer les utilisateurs</h4>
                  <p className="text-sm text-muted-foreground">
                    Créez et gérez les comptes de votre équipe
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Configurer</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajustez les paramètres selon vos besoins
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
