"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateProductData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    price: 0,
    cost: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Temporairement, on utilise des données mockées
      // const response = await api.get('/products');
      // setProducts(response.data);

      // Données mockées pour démonstration
      setProducts([
        {
          id: '1',
          name: 'Cahier de brouillon 96 pages',
          description: 'Cahier standard pour étudiants',
          sku: 'CAH-96P-001',
          barcode: '1234567890123',
          price: 500,
          cost: 300,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Stylo bille bleu',
          description: 'Stylo à bille standard',
          sku: 'STY-BLEU-002',
          price: 200,
          cost: 120,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        // Modification
        // await api.patch(`/products/${editingProduct.id}`, formData);
        alert('Produit modifié avec succès !');
      } else {
        // Création
        // await api.post('/products', formData);
        alert('Produit créé avec succès !');
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        price: 0,
        cost: 0,
      });
      setShowCreateForm(false);
      setEditingProduct(null);

      // Recharger la liste
      fetchProducts();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du produit.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      barcode: product.barcode || '',
      price: product.price,
      cost: product.cost || 0,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
      return;
    }

    try {
      // await api.delete(`/products/${product.id}`);
      alert('Produit supprimé avec succès !');
      fetchProducts();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du produit.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Produits</h2>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits et fournitures
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Annuler' : '➕ Nouveau Produit'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
            </CardTitle>
            <CardDescription>
              {editingProduct ? 'Modifiez les informations du produit' : 'Ajoutez un nouveau produit à votre catalogue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du produit *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cahier de brouillon"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">Code SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Ex: CAH-96P-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Prix de vente (FCFA) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Prix d&apos;achat (FCFA)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    placeholder="300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barcode">Code-barres</Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="1234567890123"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du produit..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingProduct(null);
                    setFormData({ name: '', description: '', sku: '', barcode: '', price: 0, cost: 0 });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Produits</CardTitle>
          <CardDescription>
            {products.length} produit(s) dans votre catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">Aucun produit trouvé</div>
              <Button onClick={() => setShowCreateForm(true)}>
                Créer votre premier produit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{product.name}</h3>
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm">
                        Prix: <span className="font-medium">{formatPrice(product.price)}</span>
                      </span>
                      {product.cost && (
                        <span className="text-sm text-muted-foreground">
                          Coût: {formatPrice(product.cost)}
                        </span>
                      )}
                      {product.barcode && (
                        <span className="text-sm text-muted-foreground">
                          Code-barres: {product.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
