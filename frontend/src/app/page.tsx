import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Bienvenue sur l&apos;ERP Genesis Core
        </h1>
        <p className="text-muted-foreground text-lg">
          Système de gestion pour librairies scolaires
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Se connecter
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
