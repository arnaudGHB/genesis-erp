"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ProductForm, productSchema } from './ProductForm';
import { z } from "zod";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  createdAt: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data || response.data);
    } catch (_err) {
      toast.error("Erreur lors du chargement des produits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFormSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsSubmitting(true);
    const action = editingProduct ? 'Mise à jour' : 'Création';
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, data);
      } else {
        await api.post('/products', data);
      }
      toast.success(`Produit ${action === 'Création' ? 'créé' : 'mis à jour'} avec succès !`);
      setCreateModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error: unknown) {
      let errorMessage = `Erreur lors de la ${action.toLowerCase()} du produit.`;
      let errorDescription = '';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
        errorMessage = response?.data?.message || errorMessage;
        errorDescription = response?.data?.error || '';
      }
      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.")) {
      try {
        await api.delete(`/products/${productId}`);
        toast.success("Produit supprimé avec succès !");
        await fetchProducts();
      } catch (_error) {
        toast.error("Erreur lors de la suppression du produit.");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Chargement des données...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Produits</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild><Button onClick={() => setEditingProduct(null)}>+ Ajouter un Produit</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Ajouter un nouveau produit</DialogTitle></DialogHeader>
            <ProductForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead><TableHead>SKU</TableHead><TableHead>Prix</TableHead><TableHead>Date de création</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell><TableCell>{product.sku}</TableCell><TableCell>{product.price} FCFA</TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Dialog open={editingProduct?.id === product.id} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
                    <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>Modifier</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Modifier le produit</DialogTitle></DialogHeader>
                      <ProductForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} defaultValues={editingProduct || {}} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(product.id)}>Supprimer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}