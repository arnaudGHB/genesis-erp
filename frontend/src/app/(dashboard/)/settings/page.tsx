import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Paramètres Système</h2>
          <p className="text-muted-foreground">
            Configuration générale de votre ERP Genesis Core
          </p>
        </div>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
          <CardDescription>
            État actuel de votre installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Base de données</span>
                <span className="text-sm text-muted-foreground">PostgreSQL (Neon)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Backend</span>
                <span className="text-sm text-muted-foreground">NestJS 11.0.1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Frontend</span>
                <span className="text-sm text-muted-foreground">Next.js 15.1.0</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Environnement</span>
                <span className="text-sm text-muted-foreground">Production</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API URL</span>
                <span className="text-sm text-muted-foreground">Render</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Authentification</span>
                <span className="text-sm text-muted-foreground">JWT + bcrypt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Design System</span>
                <span className="text-sm text-muted-foreground">Genesis Core</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Base de Données</CardTitle>
          <CardDescription>
            Configuration de la connexion PostgreSQL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="db-host">Serveur</Label>
                <Input id="db-host" value="ep-square-mode-a81y4lw4-pooler.eastus2.azure.neon.tech" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-port">Port</Label>
                <Input id="db-port" value="5432" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-name">Base de données</Label>
                <Input id="db-name" value="neondb" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="db-ssl">SSL</Label>
                <Input id="db-ssl" value="Activé" disabled />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">Connexion Base de Données</h4>
                <p className="text-sm text-muted-foreground">
                  La connexion à Neon PostgreSQL est configurée
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-sm text-muted-foreground">Déconnectée</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Backend</CardTitle>
          <CardDescription>
            Configuration des endpoints et authentification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-url">URL API</Label>
                <Input id="api-url" value="https://genesis-erp-backend.onrender.com" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-port">Port</Label>
                <Input id="api-port" value="3000 (flexible)" disabled />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CORS</span>
                <span className="text-sm text-muted-foreground">Configuré</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">JWT Authentication</span>
                <span className="text-sm text-muted-foreground">Activé</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Rate Limiting</span>
                <span className="text-sm text-muted-foreground">Non configuré</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-medium">État de l&apos;API</h4>
                <p className="text-sm text-muted-foreground">
                  L&apos;API backend est déployée sur Render
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span className="text-sm text-muted-foreground">Indisponible</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Entreprise</CardTitle>
          <CardDescription>
            Configuration des informations de votre librairie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nom de l&apos;entreprise</Label>
                <Input id="company-name" placeholder="Librairie Genesis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-email">Email de contact</Label>
                <Input id="company-email" type="email" placeholder="contact@librairie-genesis.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-phone">Téléphone</Label>
                <Input id="company-phone" placeholder="+237 6XX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-address">Adresse</Label>
                <Input id="company-address" placeholder="Yaoundé, Cameroun" />
              </div>
            </div>

            <div className="pt-4">
              <Button>Sauvegarder les Informations</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Système</CardTitle>
          <CardDescription>
            Maintenance et opérations avancées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="justify-start">
              🔄 Redémarrer Services
            </Button>
            <Button variant="outline" className="justify-start">
              📊 Exporter Données
            </Button>
            <Button variant="outline" className="justify-start">
              🗄️ Backup Base de Données
            </Button>
            <Button variant="outline" className="justify-start">
              🔧 Test de Connexion API
            </Button>
            <Button variant="outline" className="justify-start">
              📝 Logs Système
            </Button>
            <Button variant="outline" className="justify-start">
              🧪 Tests de Performance
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
