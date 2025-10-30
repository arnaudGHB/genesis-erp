"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";

export const userSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("L'adresse email est invalide."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères.").optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface UserFormProps {
  onSubmit: (data: UserFormValues & { roleIds?: string[] }) => void;
  defaultValues?: Partial<UserFormValues & { roleIds?: string[] }>;
  isSubmitting: boolean;
  roles?: Role[];
}

export function UserForm({ onSubmit, defaultValues, isSubmitting, roles = [] }: UserFormProps) {
  const form = useForm<UserFormValues & { roleIds?: string[] }>({
    resolver: zodResolver(userSchema),
    // CORRECTION : Fournir une valeur par défaut pour TOUS les champs du schéma.
    defaultValues: defaultValues || {
      name: "",
      email: "",
      password: "",
      roleIds: [],
    },
  });

  const handleSubmit = (values: UserFormValues & { roleIds?: string[] }) => {
    // Ne pas envoyer un mot de passe vide lors de la soumission
    if (!values.password) {
      delete values.password;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Section Photo de profil */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt="Photo de profil" />
            <AvatarFallback>
              <Upload className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <FormLabel>Photo de profil</FormLabel>
            <FormDescription>
              Téléchargez une photo de profil (optionnel). Fonctionnalité à implémenter.
            </FormDescription>
          </div>
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nom</FormLabel>
            <FormControl>
              <Input placeholder="John Doe" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="john.doe@email.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Mot de passe</FormLabel>
            <FormControl>
              <Input type="password" {...field} />
            </FormControl>
            <FormDescription>Laissez vide pour ne pas modifier (pour une modification).</FormDescription>
            <FormMessage />
          </FormItem>
        )}/>
        {roles.length > 0 && (
          <FormField control={form.control} name="roleIds" render={() => (
            <FormItem>
              <FormLabel>Rôles</FormLabel>
              <div className="space-y-2">
                {roles.map((role) => (
                  <FormField
                    key={role.id}
                    control={form.control}
                    name="roleIds"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = field.value || [];
                              if (checked) {
                                field.onChange([...currentValue, role.id]);
                              } else {
                                field.onChange(currentValue.filter((id) => id !== role.id));
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal">
                            {role.name}
                            {role.description && (
                              <span className="text-muted-foreground"> - {role.description}</span>
                            )}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}/>
        )}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enregistrement en cours..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
}