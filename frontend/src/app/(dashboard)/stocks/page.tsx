"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, TrendingUp, TrendingDown } from "lucide-react";

interface StockLevel {
  id: string;
  quantity: number;
  location: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
}

export default function StocksPage() {
  const { hasPermission } = useAuth();
  const [stocks, setStocks] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustingStock, setAdjustingStock] = useState<string | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    productId: '',
    location: '',
    changeQuantity: 0,
    reason: ''
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stocks');
      setStocks(response.data);
      setError(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des stocks');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentData.productId || !adjustmentData.location || adjustmentData.changeQuantity === 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await api.post('/stocks/adjust', {
        productId: adjustmentData.productId,
        location: adjustmentData.location,
        changeQuantity: adjustmentData.changeQuantity,
        reason: adjustmentData.reason || 'Ajustement manuel'
      });

      setAdjustmentData({ productId: '', location: '', changeQuantity: 0, reason: '' });
      setAdjustingStock(null);
      fetchStocks(); // Recharger les données
      alert('Stock ajusté avec succès');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Erreur lors de l\'ajustement du stock');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Épuisé', variant: 'destructive' as const };
    if (quantity < 10) return { label: 'Faible', variant: 'secondary' as const };
    return { label: 'Disponible', variant: 'default' as const };
  };

  if (!hasPermission('stock:read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Vous n'avez pas les permissions pour voir cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gestion des Stocks
          </h1>
          <p className="text-muted-foreground">
            Suivez et ajustez vos niveaux de stock
          </p>
        </div>
        {hasPermission('stock:create') && (
          <Button onClick={() => setAdjustingStock('new')}>
            <Plus className="h-4 w-4 mr-2" />
            Ajuster stock
          </Button>
        )}
      </div>

      {/* Modal d'ajustement de stock */}
      {adjustingStock && (
        <Card>
          <CardHeader>
            <CardTitle>Ajustement de stock</CardTitle>
            <CardDescription>
              Modifiez la quantité d'un produit dans un emplacement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">ID Produit</Label>
                <Input
                  id="productId"
                  value={adjustmentData.productId}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, productId: e.target.value }))}
                  placeholder="ID du produit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Emplacement</Label>
                <Input
                  id="location"
                  value={adjustmentData.location}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Magasin Yaoundé"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="changeQuantity">Quantité à ajuster</Label>
                <Input
                  id="changeQuantity"
                  type="number"
                  value={adjustmentData.changeQuantity}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, changeQuantity: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Raison</Label>
                <Input
                  id="reason"
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Réception marchandise"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleStockAdjustment}>
                Confirmer l'ajustement
              </Button>
              <Button variant="outline" onClick={() => setAdjustingStock(null)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Niveaux de stock</CardTitle>
          <CardDescription>
            {stocks.length} niveau{stocks.length > 1 ? 'x' : ''} de stock suivi{stocks.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Emplacement</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière mise à jour</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => {
                  const status = getStockStatus(stock.quantity);
                  return (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">
                        {stock.product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{stock.product.sku}</Badge>
                      </TableCell>
                      <TableCell>{stock.location}</TableCell>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          {stock.quantity > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          {stock.quantity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(stock.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission('stock:update') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustmentData({
                                  productId: stock.product.id,
                                  location: stock.location,
                                  changeQuantity: 0,
                                  reason: ''
                                });
                                setAdjustingStock(stock.id);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}