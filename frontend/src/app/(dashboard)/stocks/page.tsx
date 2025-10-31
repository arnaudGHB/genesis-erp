"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { StockAdjustForm, adjustStockSchema } from './StockAdjustForm';
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

type Product = { id: string; name: string; sku: string; };
type StockLevel = {
  id: string;
  quantity: number;
  location: string;
  product: Product;
};

export default function StocksPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stocksResponse, productsResponse] = await Promise.all([
        api.get('/stocks'),
        api.get('/products'),
      ]);
      setStockLevels(stocksResponse.data);
      setProducts(productsResponse.data.data || productsResponse.data);
    } catch (err) {
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (data: z.infer<typeof adjustStockSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post('/stocks/adjust', data);
      toast.success("Stock ajusté avec succès !");
      setModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'ajustement du stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Chargement des stocks...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
        <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild><Button>+ Ajuster un Stock</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ajuster un niveau de stock</DialogTitle></DialogHeader>
            <StockAdjustForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} products={products} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead><TableHead>Emplacement</TableHead><TableHead>Quantité en Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockLevels.map((level) => (
              <TableRow key={level.id}>
                <TableCell className="font-medium">{level.product.name}</TableCell>
                <TableCell><Badge variant="secondary">{level.location}</Badge></TableCell>
                <TableCell>{level.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}