# 🔒 Système de Sécurité - Genesis ERP

## Vue d'ensemble

Le système de sécurité de Genesis ERP est conçu pour être **flexible** et **maîtrisable**. Vous pouvez facilement basculer entre un mode développement (sans blocage) et un mode production (sécurité stricte).

## 🎯 Deux modes de fonctionnement

### Mode Développement (`DEV_MODE=true`)

**Quand l'utiliser ?**
- Pendant le développement de nouvelles fonctionnalités
- Pour tester l'application sans se soucier de l'authentification
- Quand vous travaillez sur le frontend et voulez vous concentrer sur l'UI/UX

**Comportement :**
- ✅ Toutes les routes API sont accessibles sans authentification
- ✅ Un utilisateur fictif avec tous les droits est automatiquement attaché
- ✅ Aucun JWT requis, aucune connexion nécessaire
- ✅ Pas de problèmes de CORS ou de cookies
- ✅ Login/Refresh/Logout simplifiés (pas d'accès DB)

**Configuration :**
```env
DEV_MODE=true
```

### Mode Production (`DEV_MODE=false` ou absent)

**Quand l'utiliser ?**
- En production
- Pour tester la sécurité réelle
- Quand vous voulez valider que l'authentification fonctionne correctement

**Comportement :**
- 🔒 Authentification JWT stricte obligatoire
- 🔒 Tokens signés et vérifiés avec `JWT_SECRET`
- 🔒 Refresh tokens HttpOnly sécurisés
- 🔒 Contrôle d'accès basé sur les rôles et permissions
- 🔒 Protection CORS stricte

**Configuration :**
```env
DEV_MODE=false
# ou simplement ne pas définir DEV_MODE
```

## 🚀 Comment basculer entre les modes

### Activer le mode développement (recommandé pendant le dev)

1. Dans `backend/.env`, ajoutez ou modifiez :
   ```env
   DEV_MODE=true
   ```

2. Redémarrez le backend :
   ```bash
   npm run start:dev
   ```

3. C'est tout ! Vous pouvez maintenant accéder à toutes les routes sans authentification.

### Activer le mode production

1. Dans `backend/.env`, modifiez :
   ```env
   DEV_MODE=false
   ```

2. Vérifiez que ces variables sont bien configurées :
   ```env
   JWT_SECRET=votre-secret-tres-long-et-aleatoire
   DATABASE_URL=postgresql://...
   CORS_ORIGINS=http://localhost:3000,https://votre-domaine.com
   ```

3. Redémarrez le backend :
   ```bash
   npm run start:dev
   ```

4. Assurez-vous qu'un utilisateur admin existe dans la base de données avec les bonnes permissions.

## 🛡️ Architecture de sécurité

### FlexibleAuthGuard

C'est le cœur du système. Ce guard remplace l'ancien `AuthGuard('jwt')` dans tous les controllers.

**Fichier :** `backend/src/auth/flexible-auth.guard.ts`

**Fonctionnement :**
- Lit la variable `DEV_MODE` au démarrage
- Si `DEV_MODE=true` : attache un utilisateur fictif et laisse passer
- Si `DEV_MODE=false` : délègue à `AuthGuard('jwt')` (sécurité stricte)

### Simplification du refresh

Pour éviter les blocages liés aux transactions Prisma, le système de refresh a été simplifié :

**En mode DEV :**
- Génère simplement un access token valide sans toucher à la DB

**En mode PROD :**
- Vérifie le refresh token JWT
- Génère un nouvel access token
- Repose le même cookie refresh (pas de rotation DB pour éviter P2028)

### Routes protégées

Tous ces controllers utilisent `FlexibleAuthGuard` :
- `UsersController` (`/users`)
- `ProductsController` (`/products`)
- `StocksController` (`/stocks`)
- `AuthController` (`/auth/profile`)

## 📋 Configuration minimale

Copiez `.env.example` vers `.env` et modifiez selon vos besoins :

```bash
cp .env.example .env
```

### Pour le développement local

```env
DEV_MODE=true
DATABASE_URL="postgresql://..."
JWT_SECRET=dev-secret-not-for-production
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
```

### Pour la production

```env
DEV_MODE=false
DATABASE_URL="postgresql://..."
JWT_SECRET=un-secret-tres-long-et-aleatoire-genere-par-un-outil
CORS_ORIGINS=https://votre-domaine.com
COOKIE_SAMESITE=none
NODE_ENV=production
```

## 🔍 Tests et vérification

### Vérifier le mode actuel

Appelez le endpoint de debug :
```bash
curl http://localhost:3001/auth/debug
```

Vous verrez la configuration CORS et les métadonnées de la requête.

### Tester l'authentification

**En mode DEV :**
```bash
# Accès direct sans token
curl http://localhost:3001/users
# → Devrait retourner la liste des utilisateurs
```

**En mode PROD :**
```bash
# Sans token → 401
curl http://localhost:3001/users
# → {"statusCode":401,"message":"Unauthorized"}

# Avec token valide → 200
curl http://localhost:3001/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# → Retourne la liste des utilisateurs
```

## 🚨 Sécurité en production

### Checklist avant déploiement

- [ ] `DEV_MODE=false` (ou variable supprimée)
- [ ] `JWT_SECRET` est long, aléatoire et unique (minimum 32 caractères)
- [ ] `CORS_ORIGINS` contient uniquement vos domaines de production
- [ ] `NODE_ENV=production`
- [ ] `COOKIE_SAMESITE=none` si frontend et backend sur domaines différents
- [ ] HTTPS activé (obligatoire pour `COOKIE_SAMESITE=none`)
- [ ] Variables d'environnement stockées de manière sécurisée (pas dans le code)

### Générer un JWT_SECRET sécurisé

```bash
# Linux/Mac
openssl rand -base64 48

# Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..48|%{Get-Random -Maximum 256}))
```

## 🆘 Dépannage

### "Network Error" depuis le frontend

**Causes possibles :**
- Backend non démarré
- `NEXT_PUBLIC_API_URL` incorrect dans le frontend
- CORS mal configuré (vérifier `CORS_ORIGINS`)

**Solution :**
1. Vérifier que le backend tourne : `curl http://localhost:3001/auth/debug`
2. En mode DEV, mettre `DEV_MODE=true` pour éliminer les problèmes d'auth
3. Vérifier les logs backend au démarrage (whitelist CORS affichée)

### "Unauthorized 401" en mode production

**Causes possibles :**
- `JWT_SECRET` incorrect ou non défini
- Token expiré
- Utilisateur inexistant en DB

**Solution :**
1. Vérifier `JWT_SECRET` dans `.env`
2. Redémarrer le backend après modification de `.env`
3. Tester le login : `curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password"}'`

### Menus vides dans le dashboard

**Cause :**
Les permissions de l'utilisateur ne correspondent pas aux clés attendues par le frontend.

**Solution en mode DEV :**
`DEV_MODE=true` → tous les menus s'affichent automatiquement

**Solution en mode PROD :**
Vérifier que l'utilisateur a les permissions : `user:read`, `product:read`, `stock:read`

## 📚 Ressources

- [Documentation JWT](https://jwt.io/)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**Dernière mise à jour :** 2025-10-27
**Maintenu par :** Équipe Genesis ERP
