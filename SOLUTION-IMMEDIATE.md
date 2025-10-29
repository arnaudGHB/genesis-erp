# ✅ Solution Immédiate - Connexion avec Sécurité Stricte

## Votre Configuration Actuelle

```env
DEV_MODE=false              # Sécurité JWT stricte activée
NODE_ENV=development        # Mode développement (CORS permissif)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.151:3000
JWT_SECRET=a7B!d$FgHjKlMnpQrStUvWxYz2#4%6&8*AbCdEfGhIjKlMnPqRsTuVwXyZ
```

**✅ Configuration parfaite pour tester l'authentification réelle !**

---

## 🚀 Étapes pour Se Connecter (5 minutes)

### Étape 1: Créer l'Utilisateur Admin en Base de Données

Le backend a besoin d'un utilisateur réel pour valider vos credentials.

```bash
cd backend

# Exécuter le seed pour créer l'admin
npm run prisma:seed
```

**OU manuellement:**
```bash
cd backend
npx prisma db seed
```

**Attendu:**
```
Start seeding ...
Permissions created/verified.
Roles created/verified.
All permissions assigned to Administrateur role.
Admin user created/verified: admin.genesis@erp.com
Seeding finished.
```

### Étape 2: Redémarrer le Backend

```bash
cd backend

# Arrêter (Ctrl+C si déjà lancé)

# Redémarrer
npm run start:dev
```

**✅ Vérifiez les logs - vous devez voir:**
```
[NestFactory] Starting Nest application...
🔓 CORS: Mode développement - origines localhost autorisées
[RouterExplorer] Mapped {/auth/login, POST} route
...
[NestApplication] Nest application successfully started
```

**Note:** Malgré `DEV_MODE=false`, vous voyez `🔓 CORS: Mode développement` car `NODE_ENV=development` (CORS permissif pour faciliter le dev).

### Étape 3: Vérifier le Frontend

Assurez-vous que `frontend/.env.local` existe:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Redémarrez le frontend:

```bash
cd frontend

# Arrêter (Ctrl+C)

# Redémarrer
npm run dev
```

### Étape 4: Se Connecter

1. Ouvrez **`http://localhost:3000/login`**

2. Entrez les credentials de l'admin créé par le seed:
   - **Email:** `admin.genesis@erp.com`
   - **Password:** `SuperPassword123!`

3. Cliquez **"Se connecter"**

4. **✅ Vous accédez au dashboard avec tous les menus!**

---

## 🎯 Credentials par Défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin.genesis@erp.com` |
| Mot de passe | `SuperPassword123!` |
| Rôle | Administrateur |
| Permissions | Toutes (user:*, product:*, stock:*) |

---

## 🔍 Vérifications

### Test 1: Backend accessible ?

```bash
curl http://localhost:3001/auth/debug
```

**Attendu:** JSON avec `"ok": true`

### Test 2: Utilisateur existe ?

```bash
# Se connecter avec curl
curl -i -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin.genesis@erp.com\",\"password\":\"SuperPassword123!\"}"
```

**Attendu:** 
- Status: `200 OK`
- Body: `{"access_token":"eyJhbGc..."}`
- Header: `Set-Cookie: refresh_token=...`

**Si 401 Unauthorized:**
- ❌ Utilisateur pas créé → Retour Étape 1 (seed)
- ❌ Mauvais mot de passe → Vérifier le password dans le seed

### Test 3: Profile accessible avec token ?

```bash
# Copier l'access_token du test précédent
curl -i http://localhost:3001/auth/profile \
  -H "Authorization: Bearer VOTRE_ACCESS_TOKEN"
```

**Attendu:**
```json
{
  "id": "...",
  "email": "admin.genesis@erp.com",
  "name": "Admin Genesis",
  "roles": [
    {
      "name": "Administrateur",
      "permissions": [
        {"name": "user:read"},
        {"name": "product:read"},
        {"name": "stock:read"},
        ...
      ]
    }
  ]
}
```

---

## 🚨 Dépannage

### "Invalid credentials" après login

**Cause:** Utilisateur pas créé ou mauvais password

**Solution:**
1. Vérifier que le seed a bien tourné:
   ```bash
   cd backend
   npm run prisma:seed
   ```

2. Vérifier manuellement en DB (optionnel):
   ```bash
   cd backend
   npx prisma studio
   ```
   - Aller dans la table `User`
   - Vérifier que `admin.genesis@erp.com` existe

### "Network Error" dans le navigateur

**Cause:** Backend pas démarré ou CORS bloqué

**Solution:**
1. Vérifier backend tourne: `curl http://localhost:3001/auth/debug`
2. Logs backend doivent montrer `🔓 CORS: Mode développement`
3. Si logs montrent `❌ CORS bloqué`, vérifier `NODE_ENV=development` dans `.env`

### Dashboard redirige vers login après connexion réussie

**Cause:** `/auth/profile` échoue (401)

**Solution:**
1. Vérifier que l'admin a bien des rôles et permissions (Test 3 ci-dessus)
2. Vérifier `JWT_SECRET` identique entre login et validation
3. Redémarrer backend après modification `.env`

### Menus (Users, Products, Stocks) invisibles

**Cause:** Permissions manquantes

**Solution:**
1. Le seed doit créer toutes les permissions
2. Vérifier dans DevTools (F12) → Network → `/auth/profile` → Response
3. Doit contenir `roles[].permissions[]` avec `user:read`, `product:read`, `stock:read`

---

## 📝 Script package.json

Pour faciliter le seed, ajoutez dans `backend/package.json`:

```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

OU directement:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Puis:
```bash
npm run prisma:seed
# OU
npx prisma db seed
```

---

## 🎯 Configuration Actuelle vs Comportements

| Variable | Valeur | Effet |
|----------|--------|-------|
| `DEV_MODE` | `false` | ✅ JWT strict activé (credentials requis) |
| `NODE_ENV` | `development` | ✅ CORS permissif (localhost auto) |
| `CORS_ORIGINS` | 3 origines | ✅ Whitelist (mais non utilisée car NODE_ENV=development) |
| `JWT_SECRET` | Défini | ✅ Tokens signés et vérifiés |

**Résultat:**
- 🔒 **Authentification stricte** (login/password requis)
- 🔓 **CORS permissif** (pas de blocage réseau localhost)
- ✅ **Idéal pour tester la vraie sécurité sans friction réseau**

---

## 🔄 Pour Revenir en Mode Bypass Total

Si vous voulez travailler sans authentification:

```env
DEV_MODE=true
NODE_ENV=development
```

Redémarrer backend, et vous pourrez vous connecter sans credentials.

---

## 📞 Commandes Utiles

```bash
# Seed (créer admin)
cd backend && npm run prisma:seed

# Voir mode actuel
cd backend && node toggle-security.js

# Basculer en mode bypass
cd backend && node toggle-security.js dev

# Basculer en mode strict
cd backend && node toggle-security.js prod

# Tester backend
curl http://localhost:3001/auth/debug
```

---

## ✅ Checklist Finale

- [ ] Backend `.env` contient `DEV_MODE=false` et `NODE_ENV=development`
- [ ] Seed exécuté: `npm run prisma:seed` (admin créé)
- [ ] Backend redémarré et logs montrent `🔓 CORS: Mode développement`
- [ ] Frontend `.env.local` contient `NEXT_PUBLIC_API_URL=http://localhost:3001`
- [ ] Frontend redémarré
- [ ] Login avec `admin.genesis@erp.com` / `SuperPassword123!`
- [ ] Dashboard accessible avec tous les menus

---

**Créé le:** 2025-10-28  
**Configuration:** DEV_MODE=false + NODE_ENV=development  
**Temps estimé:** 5 minutes
