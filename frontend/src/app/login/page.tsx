"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Clear URL parameters on mount to prevent credential exposure
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('email') || url.searchParams.has('password')) {
        // Clear sensitive parameters from URL
        url.searchParams.delete('email');
        url.searchParams.delete('password');
        window.history.replaceState({}, '', url.pathname + url.hash);
      }
    }
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Attempting login with', { email: data.email });
      const response = await api.post('/auth/login', data);
      console.log('Login response', response);
      const { access_token } = response.data;
      await login(access_token);
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error("Erreur de connexion:", error);

      // Handle different error types with better detection
      const axiosError = error as {
        code?: string;
        message?: string;
        response?: { status?: number; data?: { message?: string } };
        isAxiosError?: boolean;
      };

      // Check for network errors
      if (axiosError.code === 'NETWORK_ERROR' ||
          axiosError.message?.includes('Network Error') ||
          axiosError.message?.includes('ERR_NETWORK') ||
          !axiosError.response) {
        alert('Erreur de connexion réseau. Vérifiez votre connexion internet ou l\'URL du serveur.');
      } else if (axiosError.response?.status === 401) {
        alert('Email ou mot de passe incorrect.');
      } else if (axiosError.response?.status === 429) {
        alert('Trop de tentatives. Veuillez réessayer dans quelques minutes.');
      } else if (axiosError.response?.status === 500) {
        alert('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (axiosError.response?.status === 404) {
        alert('Service non trouvé. Vérifiez la configuration.');
      } else {
        const errorMessage = axiosError.response?.data?.message || 'Erreur de connexion inconnue.';
        alert(`Erreur: ${errorMessage}`);
      }
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Genesis Core ERP</CardTitle>
          <CardDescription className="text-muted-foreground">Connectez-vous à votre espace de gestion</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="border-input bg-background text-foreground"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                className="border-input bg-background text-foreground"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
