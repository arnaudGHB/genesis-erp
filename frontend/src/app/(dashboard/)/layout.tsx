"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading, logout, user, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading || !token) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white p-4 border-r flex flex-col">
        <h1 className="text-2xl font-bold text-genesis-blue mb-8">Genesis ERP</h1>
        <nav className="flex flex-col space-y-2">
          <Link href="/dashboard" className="p-2 rounded hover:bg-gray-200">Accueil</Link>

          {hasPermission('user:read') && (
            <Link href="/users" className="p-2 rounded hover:bg-gray-200">Utilisateurs</Link>
          )}
          {hasPermission('product:read') && (
            <Link href="/products" className="p-2 rounded hover:bg-gray-200">Produits</Link>
          )}
          {hasPermission('stock:read') && (
            <Link href="/stocks" className="p-2 rounded hover:bg-gray-200">Stocks</Link>
          )}
        </nav>
        <div className="mt-auto pt-4 border-t">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <button onClick={logout} className="w-full mt-2 p-2 text-left rounded hover:bg-red-100 text-red-600">
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white p-4 border-b flex justify-end">
          <div>Profil</div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
