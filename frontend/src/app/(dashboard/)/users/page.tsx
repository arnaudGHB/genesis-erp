"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  name?: string;
  roles: {
    id: string;
    name: string;
    description?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface CreateUserData {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    name: '',
    password: '',
    roleIds: [],
  });

  const availableRoles = [
    { id: 'admin', name: 'ADMIN', description: 'Administrateur avec tous les droits' },
    { id: 'cashier', name: 'CASHIER', description: 'Caissier avec accès POS' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Temporairement, on utilise des données mockées
      // const response = await api.get('/users');
      // setUsers(response.data);

      // Données mockées pour démonstration
      setUsers([
        {
          id: '1',
          email: 'admin.genesis@erp.com',
          name: 'Admin Genesis',
          roles: [
            { id: 'admin', name: 'ADMIN', description: 'Administrateur' }
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          email: 'caissier@erp.com',
          name: 'Caissier Test',
          roles: [
            { id: 'cashier', name: 'CASHIER', description: 'Caissier' }
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // await api.post('/users', formData);
      alert('Utilisateur créé avec succès !');

      // Réinitialiser le formulaire
      setFormData({
        email: '',
        name: '',
        password: '',
        roleIds: [],
      });
      setShowCreateForm(false);

      // Recharger la liste
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de l\'utilisateur.');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${user.email}" ?`)) {
      return;
    }

    try {
      // await api.delete(`/users/${user.id}`);
      alert('Utilisateur supprimé avec succès !');
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression de l\'utilisateur.');
    }
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>

        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Annuler' : '➕ Nouvel Utilisateur'}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvel Utilisateur</CardTitle>
            <CardDescription>
              Créez un compte utilisateur avec les permissions appropriées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="utilisateur@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mot de passe sécurisé"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Le mot de passe sera haché automatiquement
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Rôles et Permissions</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableRoles.map((role) => (
                      <div
                        key={role.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.roleIds.includes(role.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        }`}
                        onClick={() => handleRoleToggle(role.id)}
                      >
                        <input
                          type="checkbox"
                          checked={formData.roleIds.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{role.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {role.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ email: '', name: '', password: '', roleIds: [] });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  Créer l&apos;Utilisateur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Utilisateurs</CardTitle>
          <CardDescription>
            {users.length} utilisateur(s) dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Chargement...</div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">Aucun utilisateur trouvé</div>
              <Button onClick={() => setShowCreateForm(true)}>
                Créer votre premier utilisateur
              </Button>
            </div>
          ) : (
            <Table>
              <TableCaption>Liste des utilisateurs enregistrés dans le système.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span>{user.name || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.roles.map((role) => (
                          <span
                            key={role.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                          >
                            {role.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                        {user.email !== 'admin.genesis@erp.com' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(user)}
                          >
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations sur les Rôles</CardTitle>
          <CardDescription>
            Comprendre les permissions de chaque rôle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-primary">ADMIN</h4>
                <p className="text-sm text-muted-foreground">
                  Accès complet à toutes les fonctionnalités du système
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  • Gestion des produits<br/>
                  • Gestion des stocks<br/>
                  • Gestion des utilisateurs<br/>
                  • Configuration système
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg">
                <h4 className="font-medium text-primary">CASHIER</h4>
                <p className="text-sm text-muted-foreground">
                  Accès limité aux opérations de caisse et vente
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  • Consultation des produits<br/>
                  • Consultation des stocks<br/>
                  • Ventes et transactions
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium">Gestion des Permissions</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Le système est extensible pour ajouter de nouveaux rôles et permissions selon vos besoins.
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Permissions granulaires</span>
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                      Implémenté
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rôles personnalisés</span>
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                      Implémenté
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Interface de gestion</span>
                    <span className="text-xs bg-warning/10 text-warning px-2 py-1 rounded">
                      En développement
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
