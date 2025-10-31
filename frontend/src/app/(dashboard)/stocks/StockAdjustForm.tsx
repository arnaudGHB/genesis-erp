"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Définir le type Product pour le combobox
type Product = { id: string; name: string; sku: string; };

export const adjustStockSchema = z.object({
  productId: z.string({ required_error: "Veuillez sélectionner un produit." }),
  location: z.string().min(3, "L'emplacement est requis."),
  changeQuantity: z.coerce.number(),
  notes: z.string().optional(),
});

type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;

interface StockAdjustFormProps {
  onSubmit: (data: AdjustStockFormValues) => void;
  isSubmitting: boolean;
  products: Product[]; // Liste de tous les produits pour le combobox
}

export function StockAdjustForm({ onSubmit, isSubmitting, products }: StockAdjustFormProps) {
  const form = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Produit</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                      {field.value ? products.find((p) => p.id === field.value)?.name : "Sélectionner un produit"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Rechercher un produit..." />
                    <CommandList>
                      <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                      <CommandGroup>
                        {products.map((product) => (
                          <CommandItem
                            value={product.name}
                            key={product.id}
                            onSelect={() => { form.setValue("productId", product.id); }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", product.id === field.value ? "opacity-100" : "opacity-0")} />
                            {product.name} ({product.sku})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Emplacement</FormLabel><FormControl><Input placeholder="Magasin Yaoundé" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="changeQuantity" render={({ field }) => (
            <FormItem><FormLabel>Quantité à ajuster</FormLabel><FormControl><Input type="number" placeholder="+50 ou -10" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Notes (Optionnel)</FormLabel><FormControl><Input placeholder="Correction inventaire" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Enregistrement..." : "Ajuster le stock"}
        </Button>
      </form>
    </Form>
  );
}