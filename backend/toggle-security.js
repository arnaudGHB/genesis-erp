#!/usr/bin/env node

/**
 * Script utilitaire pour basculer entre mode DEV et mode PROD
 * 
 * Usage:
 *   node toggle-security.js dev   # Active le mode développement
 *   node toggle-security.js prod  # Active le mode production
 *   node toggle-security.js       # Affiche le mode actuel
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');

function readEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ Fichier .env introuvable!');
    console.log('💡 Copiez .env.example vers .env pour commencer');
    process.exit(1);
  }
  return fs.readFileSync(ENV_FILE, 'utf8');
}

function writeEnv(content) {
  fs.writeFileSync(ENV_FILE, content, 'utf8');
}

function getCurrentMode(envContent) {
  const match = envContent.match(/^DEV_MODE\s*=\s*(.+)$/m);
  if (!match) return null;
  return match[1].trim().toLowerCase() === 'true' ? 'dev' : 'prod';
}

function setMode(mode) {
  let content = readEnv();
  const currentMode = getCurrentMode(content);

  if (mode === 'dev') {
    if (currentMode === 'dev') {
      console.log('ℹ️  Le mode développement est déjà activé');
      return;
    }
    
    // Ajouter ou remplacer DEV_MODE
    if (content.includes('DEV_MODE')) {
      content = content.replace(/^DEV_MODE\s*=\s*.+$/m, 'DEV_MODE=true');
    } else {
      content = `DEV_MODE=true\n${content}`;
    }
    
    writeEnv(content);
    console.log('✅ Mode développement activé!');
    console.log('');
    console.log('🎯 Vous pouvez maintenant:');
    console.log('   - Accéder au dashboard sans authentification');
    console.log('   - Voir tous les menus automatiquement');
    console.log('   - Travailler sans blocage de sécurité');
    console.log('');
    console.log('⚠️  N\'oubliez pas de redémarrer le backend: npm run start:dev');
    
  } else if (mode === 'prod') {
    if (currentMode === 'prod') {
      console.log('ℹ️  Le mode production est déjà activé');
      return;
    }
    
    // Remplacer DEV_MODE par false
    if (content.includes('DEV_MODE')) {
      content = content.replace(/^DEV_MODE\s*=\s*.+$/m, 'DEV_MODE=false');
    } else {
      content = `DEV_MODE=false\n${content}`;
    }
    
    writeEnv(content);
    console.log('✅ Mode production activé!');
    console.log('');
    console.log('🔒 Sécurité stricte:');
    console.log('   - JWT requis pour toutes les routes protégées');
    console.log('   - Authentification obligatoire');
    console.log('   - Contrôle des permissions actif');
    console.log('');
    console.log('⚠️  Vérifications nécessaires:');
    console.log('   1. JWT_SECRET est défini et sécurisé');
    console.log('   2. Un utilisateur admin existe en DB');
    console.log('   3. CORS_ORIGINS correspond à vos domaines');
    console.log('');
    console.log('⚠️  N\'oubliez pas de redémarrer le backend: npm run start:dev');
  }
}

function showStatus() {
  const content = readEnv();
  const mode = getCurrentMode(content);
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('   GENESIS ERP - Configuration Sécurité');
  console.log('═══════════════════════════════════════');
  console.log('');
  
  if (mode === 'dev') {
    console.log('📊 Mode actuel: 🟢 DÉVELOPPEMENT');
    console.log('');
    console.log('   ✅ Authentification désactivée');
    console.log('   ✅ Tous les menus visibles');
    console.log('   ✅ Pas de blocage pendant le travail');
    console.log('');
    console.log('💡 Pour activer la sécurité:');
    console.log('   node toggle-security.js prod');
  } else if (mode === 'prod') {
    console.log('📊 Mode actuel: 🔒 PRODUCTION');
    console.log('');
    console.log('   🔒 Authentification JWT stricte');
    console.log('   🔒 Contrôle des permissions actif');
    console.log('   🔒 Sécurité complète');
    console.log('');
    console.log('💡 Pour faciliter le développement:');
    console.log('   node toggle-security.js dev');
  } else {
    console.log('⚠️  DEV_MODE non défini dans .env');
    console.log('');
    console.log('💡 Définissez le mode:');
    console.log('   node toggle-security.js dev   # Mode développement');
    console.log('   node toggle-security.js prod  # Mode production');
  }
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('');
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  showStatus();
} else if (command === 'dev' || command === 'development') {
  setMode('dev');
} else if (command === 'prod' || command === 'production') {
  setMode('prod');
} else {
  console.error('❌ Commande inconnue:', command);
  console.log('');
  console.log('Usage:');
  console.log('  node toggle-security.js dev   # Active le mode développement');
  console.log('  node toggle-security.js prod  # Active le mode production');
  console.log('  node toggle-security.js       # Affiche le mode actuel');
  process.exit(1);
}
