# ⚡ Démarrage Rapide - Genesis ERP

## 🎯 Objectif: Se connecter au dashboard SANS BLOCAGE

Suivez ces 4 étapes simples:

---

## Étape 1️⃣: Configuration Backend (2 minutes)

### Ouvrez `backend/.env`

Ajoutez/modifiez ces lignes **EN HAUT du fichier**:

```env
DEV_MODE=true
NODE_ENV=development
```

Votre fichier complet devrait ressembler à:

```env
DEV_MODE=true
NODE_ENV=development
DATABASE_URL="postgresql://neondb_owner:npg_xd7j3BmtRrpY@ep-square-mode-a81y4lw4.eastus2.azure.neon.tech/neondb?sslmode=require&connect_timeout=60"
JWT_SECRET=a7B!d$FgHjKlMnpQrStUvWxYz2#4%6&8*AbCdEfGhIjKlMnPqRsTuVwXyZ
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_MS=604800000
```

**⚠️ Important:** Ne mettez PAS `CORS_ORIGINS` en mode DEV (détection automatique localhost)

---

## Étape 2️⃣: Configuration Frontend (1 minute)

### Créez/modifiez `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note:** Si le fichier n'existe pas, créez-le à la racine du dossier `frontend/`

---

## Étape 3️⃣: Redémarrer les Serveurs

### Terminal 1 - Backend

```bash
cd backend

# Arrêtez le serveur actuel (Ctrl+C si déjà lancé)

# Démarrez
npm run start:dev
```

**✅ Vérifiez les logs:** Vous devez voir `🔓 CORS: Mode développement`

### Terminal 2 - Frontend

```bash
cd frontend

# Arrêtez le serveur actuel (Ctrl+C si déjà lancé)

# Démarrez
npm run dev
```

---

## Étape 4️⃣: Tester la Connexion

1. Ouvrez votre navigateur sur **`http://localhost:3000`**

2. Allez sur la page de **login**

3. Entrez **n'importe quel email/mot de passe**
   - Exemple: `test@test.com` / `test`
   - Les credentials n'ont PAS d'importance en mode DEV

4. Cliquez sur **Se connecter**

5. **✅ Vous accédez au dashboard!**
   - Tous les menus sont visibles (Users, Products, Stocks)
   - Pas d'erreur Network
   - Pas de redirection

---

## 🎉 C'est Tout !

Vous pouvez maintenant:
- ✅ Développer sans être bloqué par l'authentification
- ✅ Accéder à toutes les routes sans JWT
- ✅ Voir tous les menus automatiquement
- ✅ Travailler sur l'UI/UX librement

---

## 🔄 Pour Activer la Vraie Sécurité (Plus Tard)

Quand vous serez prêt à tester l'authentification réelle:

### Méthode 1: Script automatique

```bash
cd backend
node toggle-security.js prod
```

### Méthode 2: Manuel

Dans `backend/.env`, changez:

```env
DEV_MODE=false
NODE_ENV=production
```

Puis:
1. Redémarrez le backend
2. Créez un utilisateur admin réel en DB
3. Testez le login avec les vrais credentials

---

## 🚨 Si Ça Ne Marche Pas

### Vérification Rapide

```bash
# Test 1: Backend accessible ?
curl http://localhost:3001/auth/debug

# Attendu: JSON avec "ok": true
```

Si le test échoue:
1. Backend pas démarré → `npm run start:dev` dans `backend/`
2. Mauvais port → vérifier `backend/.env` et logs de démarrage

### DevTools (Navigateur)

1. Ouvrez la console (`F12`)
2. Onglet **Network**
3. Tentez un login
4. Cherchez `POST http://localhost:3001/auth/login`

**Si la requête n'apparaît pas:**
- Vérifiez `NEXT_PUBLIC_API_URL` dans `frontend/.env.local`

**Si "CORS error":**
- Vérifiez `DEV_MODE=true` dans `backend/.env`
- Logs backend doivent montrer `🔓 CORS: Mode développement`

### Documentation Complète

- **`TROUBLESHOOTING.md`** - Guide de dépannage complet
- **`SECURITY.md`** - Documentation du système de sécurité
- **`SECURITY-AUDIT.md`** - Audit et architecture

---

## 📱 Commandes Utiles

```bash
# Voir le mode actuel
cd backend && node toggle-security.js

# Basculer en DEV
cd backend && node toggle-security.js dev

# Basculer en PROD
cd backend && node toggle-security.js prod

# Tester le backend
curl http://localhost:3001/auth/debug
```

---

## 🎯 Récapitulatif

| Configuration | Valeur |
|---------------|--------|
| Mode | DEV (développement) |
| Backend | `http://localhost:3001` |
| Frontend | `http://localhost:3000` |
| Authentification | Bypass (aucun credential requis) |
| CORS | Permissif (localhost auto) |
| Menus | Tous visibles |

**🚀 Vous êtes prêt à développer sans friction !**

---

**Créé le:** 2025-10-28  
**Objectif:** Démarrage rapide sans blocage  
**Temps estimé:** 3-4 minutes
