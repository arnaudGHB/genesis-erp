# 🚀 Instructions de configuration - Genesis ERP

## Configuration immédiate pour démarrer

### 1. Mettre à jour votre fichier `.env` backend

Ouvrez `backend/.env` et **ajoutez cette ligne en haut** :

```env
DEV_MODE=true
```

Votre fichier `.env` devrait ressembler à ceci :

```env
DEV_MODE=true
DATABASE_URL="postgresql://neondb_owner:npg_xd7j3BmtRrpY@ep-square-mode-a81y4lw4.eastus2.azure.neon.tech/neondb?sslmode=require&connect_timeout=60"
JWT_SECRET=a7B!d$FgHjKlMnpQrStUvWxYz2#4%6&8*AbCdEfGhIjKlMnPqRsTuVwXyZ
JWT_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_MS=604800000
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.1.151:3000
```

### 2. Redémarrer le backend

```bash
cd backend
npm run start:dev
```

Vous devriez voir dans les logs :
```
[NestFactory] Starting Nest application...
[bootstrap] CORS whitelist: http://localhost:3000
...
```

### 3. Redémarrer le frontend

```bash
cd frontend
npm run dev
```

### 4. Tester la connexion

1. Ouvrez votre navigateur sur `http://localhost:3000`
2. Allez sur la page de login
3. Essayez de vous connecter avec n'importe quel email/mot de passe
4. Vous devriez accéder au dashboard **sans erreur**

## 🎉 C'est tout !

Avec `DEV_MODE=true`, vous pouvez maintenant :
- ✅ Accéder au dashboard sans blocage
- ✅ Voir tous les menus (Users, Products, Stocks)
- ✅ Travailler sur les fonctionnalités sans vous soucier de l'authentification
- ✅ Tester votre UI/UX librement

## 🔄 Pour activer la sécurité plus tard

Quand vous serez prêt à tester la vraie sécurité :

1. Changez `DEV_MODE=true` en `DEV_MODE=false` dans `backend/.env`
2. Redémarrez le backend
3. Créez un utilisateur admin réel dans la base de données
4. Testez le login avec les vrais identifiants

Consultez `SECURITY.md` pour plus de détails sur le système de sécurité.

## ❓ En cas de problème

Si ça ne marche toujours pas :

1. Vérifiez que `DEV_MODE=true` est bien dans `backend/.env`
2. Vérifiez que le backend est bien redémarré (fermez et relancez `npm run start:dev`)
3. Vérifiez que le frontend pointe vers `http://localhost:3001` (dans `frontend/.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:3001`)
4. Videz le cache du navigateur et les cookies

## 📞 Support

Consultez `SECURITY.md` pour la documentation complète du système de sécurité.
