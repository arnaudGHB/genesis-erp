# 🔧 Dépannage - Genesis ERP

## ❌ Erreur: "AxiosError: Network Error" lors du login

### Diagnostic

Cette erreur signifie que **la requête n'atteint jamais le backend**. Ce n'est PAS un problème d'authentification, mais un problème de **réseau/CORS/configuration**.

### Causes possibles (par ordre de probabilité)

1. ✅ **Backend non démarré ou crashé**
2. ✅ **Mauvaise URL API côté frontend**
3. ✅ **CORS bloque la requête**
4. ✅ **Port incorrect**
5. ✅ **Firewall/antivirus bloque localhost**

---

## 🚀 Solution Immédiate (Mode DEV)

### Étape 1: Activer le mode développement

Ouvrez `backend/.env` et ajoutez/modifiez:

```env
DEV_MODE=true
NODE_ENV=development
```

### Étape 2: Vérifier la configuration complète

Votre `backend/.env` doit ressembler à:

```env
DEV_MODE=true
NODE_ENV=development
DATABASE_URL="postgresql://neondb_owner:npg_xd7j3BmtRrpY@ep-square-mode-a81y4lw4.eastus2.azure.neon.tech/neondb?sslmode=require&connect_timeout=60"
JWT_SECRET=a7B!d$FgHjKlMnpQrStUvWxYz2#4%6&8*AbCdEfGhIjKlMnPqRsTuVwXyZ
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_MS=604800000
```

**Note:** `CORS_ORIGINS` n'est PAS nécessaire en mode DEV (auto-détection localhost)

### Étape 3: Redémarrer le backend

```bash
cd backend

# Arrêter le backend actuel (Ctrl+C)

# Redémarrer
npm run start:dev
```

### Étape 4: Vérifier les logs au démarrage

Vous devez voir:

```
[NestFactory] Starting Nest application...
🔓 CORS: Mode développement - origines localhost autorisées
[RouterExplorer] Mapped {/auth/login, POST} route
...
[NestApplication] Nest application successfully started
```

**✅ Si vous voyez "🔓 CORS: Mode développement"** → CORS est OK

**❌ Si vous voyez "🔒 CORS: Mode production"** → DEV_MODE pas activé, retour Étape 1

### Étape 5: Vérifier le frontend

Créez/modifiez `frontend/.env.local`:

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

### Étape 6: Tester

1. Ouvrez `http://localhost:3000/login`
2. Entrez n'importe quel email/mot de passe
3. Vous devez accéder au dashboard **sans erreur**

---

## 🔍 Diagnostic Avancé

### Test 1: Backend est-il accessible ?

```bash
curl http://localhost:3001/auth/debug
```

**Attendu:**
```json
{
  "ok": true,
  "origin": null,
  ...
}
```

**Si échec:**
- ❌ Backend pas démarré → redémarrer `npm run start:dev`
- ❌ Port 3001 occupé → vérifier `PORT` dans `.env` ou tuer le processus
- ❌ Firewall → vérifier pare-feu Windows

### Test 2: CORS fonctionne-t-il ?

Depuis le navigateur, ouvrez la console (`F12`) et tapez:

```javascript
fetch('http://localhost:3001/auth/debug')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Si OK:** Vous voyez l'objet JSON
**Si échec CORS:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution:**
1. Vérifiez `DEV_MODE=true` dans `backend/.env`
2. Redémarrez le backend
3. Vérifiez les logs: doit afficher "🔓 CORS: Mode développement"

### Test 3: Frontend pointe-t-il vers la bonne URL ?

Dans `frontend/src/lib/api.ts`, vérifiez:

```typescript
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

Dans le navigateur console:

```javascript
console.log(process.env.NEXT_PUBLIC_API_URL)
```

**Attendu:** `http://localhost:3001` ou `undefined` (défaut OK)

### Test 4: Network tab dans DevTools

1. Ouvrez DevTools (`F12`) → onglet Network
2. Tentez un login
3. Cherchez `POST http://localhost:3001/auth/login`

**Cas A: La requête n'apparaît pas du tout**
- ❌ Problème frontend: mauvaise URL ou code bloqué
- Solution: Vérifier `NEXT_PUBLIC_API_URL`

**Cas B: La requête apparaît, statut `(failed)`**
- ❌ Network error, CORS, ou backend down
- Solution: Test 1 et Test 2

**Cas C: La requête apparaît, statut `401`**
- ✅ La connexion réseau fonctionne !
- ❌ Problème d'authentification
- Solution: Activer `DEV_MODE=true` pour bypass

---

## 🛠️ Problèmes Fréquents

### "Cannot read property 'data' of undefined"

**Cause:** La réponse du backend n'est pas ce que le frontend attend

**Solution:**
1. Vérifiez que le backend retourne bien `{ access_token: "..." }`
2. En mode DEV, le backend doit retourner un token même sans credentials

### "Request failed with status code 500"

**Cause:** Erreur serveur (exception backend)

**Solution:**
1. Regardez les logs backend (terminal où tourne `npm run start:dev`)
2. Identifiez l'exception (ex: Prisma, JWT, validation)
3. En mode DEV, les erreurs DB/Prisma sont bypassed

### Dashboard s'affiche puis redirige vers login

**Cause:** `/auth/profile` échoue après login réussi

**Solution en mode DEV:**
1. `DEV_MODE=true` dans backend → `/auth/profile` retourne user fictif
2. Redémarrer backend
3. Vider cookies navigateur
4. Retry login

**Solution en mode PROD:**
1. Vérifier que l'utilisateur existe en DB
2. Vérifier `JWT_SECRET` identique entre login et validation
3. Vérifier que `findOneWithPermissions()` retourne roles/permissions

### Menus (Users, Products, Stocks) invisibles

**Cause:** Permissions manquantes sur l'utilisateur

**Solution en mode DEV:**
- `DEV_MODE=true` → tous les menus visibles automatiquement

**Solution en mode PROD:**
- Vérifier que l'utilisateur a les permissions: `user:read`, `product:read`, `stock:read`
- Seed un admin avec toutes les permissions

---

## 🎯 Configuration Rapide Recommandée

### Pour travailler sans blocage (DEV)

**backend/.env:**
```env
DEV_MODE=true
NODE_ENV=development
DATABASE_URL="votre-url-database"
JWT_SECRET=dev-secret-simple
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Pour tester la vraie sécurité (PROD)

**backend/.env:**
```env
DEV_MODE=false
NODE_ENV=production
DATABASE_URL="votre-url-database"
JWT_SECRET=<generer-avec-openssl-rand-base64-48>
CORS_ORIGINS=http://localhost:3000
COOKIE_SAMESITE=lax
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Puis:
1. Créer un utilisateur admin en DB avec bcrypt password
2. Lui donner les permissions: user:*, product:*, stock:*
3. Login avec les vrais credentials

---

## 📞 Commandes Utiles

### Basculer en mode DEV

```bash
cd backend
node toggle-security.js dev
npm run start:dev
```

### Basculer en mode PROD

```bash
cd backend
node toggle-security.js prod
npm run start:dev
```

### Voir le mode actuel

```bash
cd backend
node toggle-security.js
```

### Tester le backend sans frontend

```bash
# Login
curl -i -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Debug
curl http://localhost:3001/auth/debug

# Health check
curl http://localhost:3001
```

---

## 🚨 En Dernier Recours

Si rien ne fonctionne:

1. **Arrêtez tout**
   ```bash
   # Tuer tous les processus Node
   # Windows PowerShell:
   Get-Process node | Stop-Process -Force
   ```

2. **Clean install**
   ```bash
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../frontend
   rm -rf node_modules package-lock.json .next
   npm install
   ```

3. **Vérifiez les ports**
   ```bash
   # Windows PowerShell:
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # Si occupés, tuer les processus (PID dans dernière colonne)
   taskkill /PID <PID> /F
   ```

4. **Logs complets**
   - Backend: tout le terminal de `npm run start:dev`
   - Frontend: console navigateur (F12) onglet Console + Network
   - Partagez ces logs pour diagnostic

---

**Besoin d'aide ?** Consultez `SECURITY.md` pour la doc complète ou `SECURITY-AUDIT.md` pour l'architecture.
