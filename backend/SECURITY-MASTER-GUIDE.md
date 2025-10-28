# 🔐 GUIDE MAÎTRE DE LA SÉCURITÉ - Genesis ERP

## Vue d'ensemble complète du système de sécurité

---

## 🎯 OBJECTIF DE CE GUIDE

**Maîtriser complètement le système de sécurité** pour pouvoir :
- ✅ Activer/désactiver la sécurité instantanément
- ✅ Déboguer tout problème de sécurité
- ✅ Comprendre le flux complet d'authentification
- ✅ Basculer entre modes DEV/PROD sans blocage
- ✅ Résoudre les problèmes de connexion

---

## 📊 ÉTATS POSSIBLES DU SYSTÈME

### 🔓 **MODE DÉVELOPPEMENT** (DEV_MODE=true)
```bash
# État actuel
✅ Authentification BYPASS - accès libre à toutes les routes
✅ CORS permissif - accepte toutes les origines localhost
✅ Erreurs détaillées - pour le développement
✅ Debug activé - endpoint /auth/debug disponible
```

### 🔒 **MODE PRODUCTION** (DEV_MODE=false)
```bash
# État actuel
🔒 Authentification JWT stricte
🔒 CORS restrictif - whitelist uniquement
🔒 Erreurs génériques - sécurité production
🔒 Debug désactivé
```

---

## 🛠️ COMMANDES DE CONTRÔLE

### Script Principal : `security-control.js`

```bash
cd backend

# 📊 Voir l'état actuel
node security-control.js status

# 🔓 Activer mode développement (recommandé pour dev)
node security-control.js dev-on

# 🔒 Désactiver mode développement (pour prod)
node security-control.js dev-off

# 🧪 Tester l'authentification complète
node security-control.js test-auth

# 🗑️ Reset base de données sécurité
node security-control.js reset-db

# 🐛 Activer/désactiver debug
node security-control.js debug-on
node security-control.js debug-off
```

---

## 🔄 FLUX D'AUTHENTIFICATION COMPLET

### **1. Login (/auth/login)**
```
Frontend → POST /auth/login
    ↓
Backend valide credentials (email/password)
    ↓
Génère access_token (court) + refresh_token (long)
    ↓
Stocke refresh_token hashé en DB
    ↓
Set cookie HttpOnly avec refresh_token
    ↓
Retourne access_token au frontend
```

### **2. Accès Routes Protégées**
```
Frontend → GET /protected-route
    ↓
FlexibleAuthGuard vérifie DEV_MODE
    ↓
Si DEV_MODE=true: bypass complet
Si DEV_MODE=false: vérifie JWT access_token
    ↓
RolesGuard vérifie permissions utilisateur
    ↓
Accès autorisé/refusé
```

### **3. Refresh Token (/auth/refresh)**
```
Frontend → POST /auth/refresh (avec cookie)
    ↓
Backend vérifie refresh_token cookie
    ↓
Valide token JWT + hash en DB
    ↓
Génère nouveau access_token + refresh_token
    ↓
Révoque ancien refresh_token
    ↓
Set nouveau cookie + retourne access_token
```

---

## 🐛 DÉBOGAGE ET TROUBLESHOOTING

### **Problème : "Resté bloqué à la page de connexion"**

#### ✅ **Solution Rapide :**
```bash
cd backend
node security-control.js dev-on
# Redémarrer le serveur backend
```

#### 🔍 **Diagnostic Complet :**
```bash
# 1. Vérifier l'état de la sécurité
node security-control.js status

# 2. Tester l'authentification
node security-control.js test-auth

# 3. Vérifier les logs backend
# Regarder les erreurs Prisma/connection DB

# 4. Vérifier CORS
curl -H "Origin: http://localhost:3000" -I http://localhost:3001/auth/debug
```

### **Problème : "Erreur de connexion DB"**

#### ✅ **Solutions :**
```bash
# 1. Vérifier que PostgreSQL tourne
# 2. Vérifier DATABASE_URL dans .env
# 3. Tester connexion Prisma
npx prisma db push

# 4. Reset DB si nécessaire
node security-control.js reset-db
```

### **Problème : "CORS bloqué"**

#### ✅ **Solutions :**
```bash
# Mode dev (recommandé)
node security-control.js dev-on

# Ou ajouter origine manuellement dans .env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## 🎮 MODES DE FONCTIONNEMENT

### **Mode DEV (Recommandé pour développement)**
```bash
node security-control.js dev-on
```
- ✅ **Avantages** : Pas de blocage, développement fluide
- ✅ **Sécurité** : Bypass temporaire, données de test
- ✅ **Debug** : Erreurs détaillées, endpoint debug

### **Mode PROD (Pour production/test sécurité)**
```bash
node security-control.js dev-off
```
- 🔒 **Avantages** : Sécurité maximale, authentification réelle
- ⚠️ **Risques** : Peut bloquer si mal configuré
- 🔒 **Debug** : Erreurs génériques, logs sécurisés

---

## 🔧 CONFIGURATION TECHNIQUE

### Variables d'Environnement Critiques

```env
# Sécurité
DEV_MODE=true                    # Mode dev (true/false)
NODE_ENV=development             # Environnement
JWT_SECRET=<secret-fort>         # Secret JWT (48+ chars)
ALLOW_DEBUG=true                 # Debug activé (dev seulement)

# Base de données
DATABASE_URL=postgresql://...    # URL PostgreSQL

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Cookies
COOKIE_SAMESITE=lax              # lax pour dev, none pour prod cross-site
```

### Architecture des Guards

```
FlexibleAuthGuard (Premier niveau)
├── DEV_MODE=true → Bypass complet
└── DEV_MODE=false → Vérification JWT

RolesGuard (Deuxième niveau)
├── Vérifie présence utilisateur
├── Extrait rôles depuis user.roles
└── Valide permissions requises
```

---

## 🚀 WORKFLOW RECOMMANDÉ

### **Développement Quotidien :**
```bash
# 1. Activer mode dev
cd backend && node security-control.js dev-on

# 2. Démarrer les serveurs
npm run start:dev  # Backend
cd ../frontend && npm run dev  # Frontend

# 3. Développer sans blocage
# Toutes les routes sont accessibles
```

### **Test de Sécurité :**
```bash
# 1. Basculer en mode prod
cd backend && node security-control.js dev-off

# 2. Tester authentification
node security-control.js test-auth

# 3. Vérifier les logs
# Redémarrer serveur si nécessaire
```

### **Debug Problème :**
```bash
# 1. Activer debug
node security-control.js debug-on

# 2. Consulter endpoint debug
curl http://localhost:3001/auth/debug

# 3. Analyser les logs backend
# Vérifier erreurs Prisma/CORS
```

---

## 📋 CHECKLIST DE DIAGNOSTIC

### **Avant de demander de l'aide :**
- [ ] `node security-control.js status` → État actuel
- [ ] `node security-control.js test-auth` → Test auth
- [ ] Serveur backend tourne sur port 3001
- [ ] Base de données accessible
- [ ] Variables d'environnement correctes

### **Si bloqué à la connexion :**
- [ ] `node security-control.js dev-on` → Solution immédiate
- [ ] Redémarrer serveur backend
- [ ] Vider cache navigateur (Ctrl+F5)
- [ ] Vérifier console navigateur (F12)

---

## 🎯 CONCLUSION

**Avec ce guide, vous maîtrisez complètement la sécurité :**

✅ **Activation/désactivation instantanée** avec `security-control.js`  
✅ **Diagnostic rapide** des problèmes  
✅ **Basculement fluide** entre modes DEV/PROD  
✅ **Débogage efficace** avec outils intégrés  
✅ **Développement sans blocage** en mode DEV  

**Règle d'or :** En développement, gardez toujours `DEV_MODE=true` pour éviter les blocages !

---

*Guide créé par Expert Sécurité - Genesis ERP*  
*Dernière mise à jour : 2025-10-28*