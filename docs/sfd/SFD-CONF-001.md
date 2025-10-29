# SFD - CONF-001 - Gestion Utilisateurs, Rôles, MFA & Logs
Version: 1.0
Auteur: IA-Executor
Date: 2025-10-29

Résumé:
Permettre à un administrateur de gérer les utilisateurs (CRUD), attribuer des rôles/permissions granulaires,
activer/désactiver MFA (TOTP) et garder un historique (logs) des actions admin.

Acteurs:
- Administrateur
- Utilisateur (employé)
- Système de notification (email/SMS)

Préconditions:
- L'admin est authentifié.
- Base utilisateurs initialisée.

Scénario principal:
1. Admin ouvre la page "Utilisateurs".
2. Admin crée un nouvel utilisateur (email, nom, rôle, initial password).
3. Système enregistre l'utilisateur, déclenche email d'activation.
4. Admin peut activer MFA pour l'utilisateur (génère secret QR).
5. Actions (create/update/delete/login-fail) sont consignées dans les logs.

Exceptions:
- Email existant -> 400 "Utilisateur déjà existant".
- Erreur DB -> 500 et rollback.

Règles métier:
- Rôles: ADMIN, MANAGER, CAISSIER, VENDEUR, COMPTA.
- Permissions mappées par rôle (voir matrix dans STB).
- MFA optionnel mais recommandé;si activé, login exige TOTP.

Critères d'acceptation:
- CA1: Admin peut créer/modifier/supprimer utilisateur.
- CA2: Rôles limitent l'accès aux endpoints protégés.
- CA3: MFA TOTP peut être activé/désactivé et vérifié.
- CA4: Logs des actions admin stockés et consultables (période 1 an).