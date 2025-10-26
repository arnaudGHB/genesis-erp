"use client";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold">Bienvenue, {user?.name || 'Utilisateur'} !</h1>
      <p className="mt-2 text-gray-600">
        Ceci est votre tableau de bord. Utilisez la navigation à gauche pour explorer les modules.
      </p>
    </div>
  );
}
