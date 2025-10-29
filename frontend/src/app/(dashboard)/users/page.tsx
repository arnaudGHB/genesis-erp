"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserForm, userSchema } from './UserForm';
import { z } from "zod";

type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || response.data); // Gère la pagination future
    } catch (_err) {
      toast.error("Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFormSubmit = async (data: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    const action = editingUser ? 'Mise à jour' : 'Création';
    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, data);
      } else {
        await api.post('/users', data);
      }
      toast.success(`Utilisateur ${action === 'Création' ? 'créé' : 'mis à jour'} avec succès !`);
      setCreateModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: unknown) {
      let errorMessage = `Erreur lors de la ${action.toLowerCase()} de l'utilisateur.`;
      let errorDescription = '';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const response = (error as any).response;
        errorMessage = response?.data?.message || errorMessage;
        errorDescription = response?.data?.error || '';
      }
      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
        try {
            await api.delete(`/users/${userId}`);
            toast.success("Utilisateur supprimé avec succès !");
            await fetchUsers();
        } catch (_error) {
            toast.error("Erreur lors de la suppression de l'utilisateur.");
        }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Chargement des données...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogTrigger asChild><Button>+ Ajouter un Utilisateur</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Ajouter un nouvel utilisateur</DialogTitle></DialogHeader>
            <UserForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Date de création</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell><TableCell>{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-right space-x-2">
                   <Dialog open={editingUser?.id === user.id} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
                    <DialogTrigger asChild><Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>Modifier</Button></DialogTrigger>
                    <DialogContent><DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle></DialogHeader>
                      <UserForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} defaultValues={{ name: editingUser?.name || '', email: editingUser?.email || '' }} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>Supprimer</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}