"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StockLevel {
  id: string;
  quantity: number;
  location: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdjustStockData {
  productId: string;
  location: string;
  changeQuantity: number;
}

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [formData, setFormData] = useState<AdjustStockData>({
    productId: '',
    location: '',
    changeQuantity: 0,
  });

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      // Temporairement, on utilise des données mockées
      // const response = await api.get('/stocks');
      // setStocks(response.data);

      // Données mockées pour démonstration
      setStocks([
        {
          id: '1',
          quantity: 50,
          location: 'Magasin Yaoundé',
          productId: '1',
          product: {
            id: '1',
            name: 'Cahier de brouillon 96 pages',
            sku: 'CAH-96P-001',
            price: 500,
          },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          quantity: 100,
          location: 'Entrepôt Douala',
          productId: '1',
          product: {
            id: '1',
            name: 'Cahier de brouillon 96 pages',
            sku: 'CAH-96P-001',
            price: 500,
          },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // await api.post('/stocks/adjust', formData);
      alert(`Stock ajusté de ${formData.changeQuantity > 0 ? '+' : ''}${formData.changeQuantity} unités !`);

      // Réinitialiser le formulaire
      setFormData({
        productId: '',
        location: '',
        changeQuantity: 0,
      });
      setShowAdjustForm(false);

      // Recharger la liste
      fetchStocks();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l&apos;ajustement du stock.');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: 'Rupture', color: 'text-destructive' };
    if (quantity < 10) return { label: 'Faible', color: 'text-warning' };
    return { label: 'Normal', color: 'text-success' };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(price);
  };

  const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.product.price), 0);
  const totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Stocks</h2>
          <p className="text-muted-foreground">
            Gérez votre inventaire et ajustez les quantités
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">📊 Rapport Stock</Button>
          <Button onClick={() => setShowAdjustForm(!showAdjustForm)}>
            {showAdjustForm ? 'Annuler' : '📦 Ajuster Stock'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles en Stock</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">
              Total dans tous les emplacements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emplacements</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📍</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(stocks.map(s => s.location)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Sites de stockage différents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💰</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Valeur de l&apos;inventaire
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adjust Stock Form */}
      {showAdjustForm && (
        <Card>
          <CardHeader>
            <CardTitle>Ajustement de Stock</CardTitle>
            <CardDescription>
              Ajoutez ou retirez des quantités de stock pour un produit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="productId">Produit *</Label>
                  <Input
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    placeholder="ID du produit (CAH-96P-001)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Emplacement *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Magasin Yaoundé"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="changeQuantity">Quantité *</Label>
                  <Input
                    id="changeQuantity"
                    type="number"
                    value={formData.changeQuantity}
                    onChange={(e) => setFormData({ ...formData, changeQuantity: parseInt(e.target.value) || 0 })}
                    placeholder="+10 ou -5"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    + pour ajouter, - pour retirer
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAdjustForm(false);
                    setFormData({ productId: '', location: '', changeQuantity: 0 });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Ajuster le Stock
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stock Levels List */}
      <Card>
        <CardHeader>
          <CardTitle>Niveaux de Stock</CardTitle>
          <CardDescription>
            Vue détaillée de votre inventaire par produit et emplacement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : stocks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">Aucun stock trouvé</div>
              <Button onClick={() => setShowAdjustForm(true)}>
                Ajouter votre premier stock
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {stocks.map((stock) => {
                const status = getStockStatus(stock.quantity);
                return (
                  <div
                    key={stock.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{stock.product.name}</h3>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {stock.product.sku}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm">
                          📍 {stock.location}
                        </span>
                        <span className="text-sm">
                          Quantité: <span className="font-medium">{stock.quantity}</span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Prix: {formatPrice(stock.product.price)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Valeur: {formatPrice(stock.quantity * stock.product.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            productId: stock.productId,
                            location: stock.location,
                            changeQuantity: 0,
                          });
                          setShowAdjustForm(true);
                        }}
                      >
                        Ajuster
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      {stocks.some(s => s.quantity < 10) && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="text-warning">⚠️ Alertes Stock</CardTitle>
            <CardDescription>
              Produits nécessitant une attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stocks.filter(s => s.quantity < 10).map((stock) => (
                <div key={stock.id} className="flex items-center justify-between text-sm">
                  <span>{stock.product.name} ({stock.location})</span>
                  <span className="text-warning font-medium">
                    Stock faible: {stock.quantity} unités
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
