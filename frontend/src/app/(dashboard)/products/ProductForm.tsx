"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export const productSchema = z.object({
  name: z.string().min(3, "Le nom doit faire au moins 3 caractères."),
  sku: z.string().min(1, "Le SKU est requis."),
  price: z.coerce.number().min(0, "Le prix doit être positif."),
  description: z.string().optional(),
  barcode: z.string().optional(),
  cost: z.coerce.number().min(0, "Le coût doit être positif.").optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormValues) => void;
  defaultValues?: Partial<ProductFormValues>;
  isSubmitting: boolean;
}

export function ProductForm({ onSubmit, defaultValues, isSubmitting }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues || {},
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nom du produit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sku" render={({ field }) => (
              <FormItem><FormLabel>SKU (Code article)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="barcode" render={({ field }) => (
              <FormItem><FormLabel>Code-barres (ISBN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem><FormLabel>Prix de Vente</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="cost" render={({ field }) => (
              <FormItem><FormLabel>Coût d'achat</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </form>
    </Form>
  );
}