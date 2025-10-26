"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading, logout, user, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/login"); // Utiliser replace pour ne pas polluer l'historique
    }
  }, [isLoading, token, router]);

  // Affichage pendant que le contexte vérifie l'authentification
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }

  // Si le chargement est fini et qu'il n'y a toujours pas de token, on n'affiche rien
  // car la redirection est en cours.
  if (!token) {
    return null;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              {/* Ajouter une icône plus tard */}
              <span className="">Genesis ERP</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-auto py-4 px-2 text-sm font-medium">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Accueil</Link>

            {hasPermission('user:read') && (
              <Link href="/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Utilisateurs</Link>
            )}
            {hasPermission('product:read') && (
              <Link href="/products" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Produits</Link>
            )}
            {hasPermission('stock:read') && (
              <Link href="/stocks" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Stocks</Link>
            )}
          </nav>
          <div className="mt-auto p-4 border-t">
             <p className="font-semibold text-sm">{user?.name}</p>
             <p className="text-xs text-gray-500">{user?.email}</p>
             <Button onClick={logout} variant="outline" size="sm" className="w-full mt-2">
               Se déconnecter
             </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* On pourra mettre un menu mobile ici */}
          <div className="w-full flex-1">
            {/* On pourra mettre une barre de recherche globale ici */}
          </div>
          {/* On pourra mettre un menu de profil ici */}
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
