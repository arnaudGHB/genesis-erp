"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserForm, userSchema } from './UserForm';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { UserProfilePanel } from './components/user-profile-panel';
import { z } from "zod";

type User = {
  id: string;
  name: string | null;
  email: string;
  roles: { id: string; name: string }[];
  createdAt: string;
};

type Role = {
  id: string;
  name: string;
  description: string | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || response.data); // Gère la pagination future
    } catch {
      toast.error("Erreur lors du chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles/all');
      setRoles(response.data);
    } catch {
      toast.error("Erreur lors du chargement des rôles.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleFormSubmit = async (data: z.infer<typeof userSchema> & { roleIds?: string[] }) => {
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
        const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
        errorMessage = response?.data?.message || errorMessage;
        errorDescription = response?.data?.error || '';
      }
      toast.error(errorMessage, { description: errorDescription });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success("Utilisateur supprimé avec succès !");
        await fetchUsers();
        setSelectedUser(null); // Fermer le panneau si l'utilisateur supprimé était sélectionné
      } catch {
        toast.error("Erreur lors de la suppression de l'utilisateur.");
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p>Chargement des données...</p></div>;

  return (
    <div className="flex h-full">
      <div className="flex-1 space-y-4 p-4">
        {/* En-tête avec compteur et bouton d'ajout */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Utilisateurs</h1>
            <p className="text-muted-foreground">{users.length} actifs</p>
          </div>

          {/* --- MODALE DE CRÉATION --- */}
          <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>+ Nouvel Utilisateur</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajouter un nouvel utilisateur</DialogTitle></DialogHeader>
              <UserForm onSubmit={handleFormSubmit} isSubmitting={isSubmitting} roles={roles} />
            </DialogContent>
          </Dialog>
        </div>

        {/* DataTable avec toutes les fonctionnalités */}
        <DataTable
          columns={columns}
          data={users}
          onRowClick={handleRowClick}
          onEditUser={handleEditUser}
          onViewProfile={handleViewProfile}
          onDeleteUser={handleDeleteUser}
        />

        {/* --- MODALE DE MODIFICATION --- */}
        <Dialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Modifier l'utilisateur</DialogTitle></DialogHeader>
            <UserForm
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
              roles={roles}
              defaultValues={{
                name: editingUser?.name || '',
                email: editingUser?.email || '',
                roleIds: editingUser?.roles?.map(role => role.id) || []
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Panneau latéral de profil */}
      {selectedUser && (
        <UserProfilePanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={handleEditUser}
        />
      )}
    </div>
  );
}