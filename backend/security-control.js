#!/usr/bin/env node

/**
 * 🔐 SECURITY CONTROL SCRIPT - Genesis ERP
 *
 * Script de contrôle et gestion du système de sécurité
 * Permet de maîtriser complètement le comportement de la sécurité
 *
 * Usage:
 * node security-control.js [command] [options]
 *
 * Commands:
 * - status: Affiche l'état actuel de la sécurité
 * - dev-on: Active le mode développement
 * - dev-off: Désactive le mode développement
 * - test-auth: Test complet du système d'authentification
 * - reset-db: Réinitialise la base de données de sécurité
 * - debug-on: Active le debug de sécurité
 * - debug-off: Désactive le debug de sécurité
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENV_FILE = path.join(__dirname, '.env');
const BACKUP_ENV = path.join(__dirname, '.env.backup');

class SecurityController {
  constructor() {
    this.envContent = '';
    this.loadEnv();
  }

  loadEnv() {
    try {
      this.envContent = fs.readFileSync(ENV_FILE, 'utf8');
    } catch (error) {
      console.error('❌ Fichier .env non trouvé');
      process.exit(1);
    }
  }

  saveEnv(content) {
    // Créer un backup
    if (fs.existsSync(ENV_FILE)) {
      fs.copyFileSync(ENV_FILE, BACKUP_ENV);
    }
    fs.writeFileSync(ENV_FILE, content);
    console.log('✅ Configuration sauvegardée');
  }

  getEnvVar(name) {
    const regex = new RegExp(`^${name}=(.*)$`, 'm');
    const match = this.envContent.match(regex);
    return match ? match[1] : null;
  }

  setEnvVar(name, value) {
    const regex = new RegExp(`^${name}=.*$`, 'm');
    if (regex.test(this.envContent)) {
      this.envContent = this.envContent.replace(regex, `${name}=${value}`);
    } else {
      this.envContent += `\n${name}=${value}`;
    }
  }

  status() {
    console.log('🔍 ÉTAT DU SYSTÈME DE SÉCURITÉ\n');

    const devMode = this.getEnvVar('DEV_MODE');
    const nodeEnv = this.getEnvVar('NODE_ENV');
    const jwtSecret = this.getEnvVar('JWT_SECRET');
    const corsOrigins = this.getEnvVar('CORS_ORIGINS');
    const allowDebug = this.getEnvVar('ALLOW_DEBUG');

    console.log(`📊 Mode DEV_MODE: ${devMode === 'true' ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}`);
    console.log(`🌍 NODE_ENV: ${nodeEnv || 'development'}`);
    console.log(`🔑 JWT_SECRET: ${jwtSecret ? '✅ CONFIGURÉ' : '❌ MANQUANT'}`);
    console.log(`🌐 CORS_ORIGINS: ${corsOrigins || '❌ NON CONFIGURÉ'}`);
    console.log(`🐛 ALLOW_DEBUG: ${allowDebug === 'true' ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}`);

    console.log('\n🎯 COMPORTEMENT ACTUEL:');
    if (devMode === 'true') {
      console.log('✅ Authentification BYPASS - accès libre à toutes les routes');
      console.log('✅ CORS permissif - accepte toutes les origines localhost');
      console.log('✅ Erreurs détaillées - pour le développement');
    } else {
      console.log('🔒 Authentification JWT stricte');
      console.log('🔒 CORS restrictif - whitelist uniquement');
      console.log('🔒 Erreurs génériques - sécurité production');
    }

    console.log('\n💡 COMMANDES DISPONIBLES:');
    console.log('node security-control.js dev-on    # Activer mode dev');
    console.log('node security-control.js dev-off   # Désactiver mode dev');
    console.log('node security-control.js test-auth # Tester l\'authentification');
    console.log('node security-control.js debug-on  # Activer debug');
    console.log('node security-control.js reset-db  # Reset DB sécurité');
  }

  devOn() {
    console.log('🔓 ACTIVATION DU MODE DÉVELOPPEMENT');
    this.setEnvVar('DEV_MODE', 'true');
    this.setEnvVar('NODE_ENV', 'development');
    this.setEnvVar('ALLOW_DEBUG', 'true');
    this.saveEnv(this.envContent);
    console.log('✅ Mode développement activé - redémarrez le serveur');
  }

  devOff() {
    console.log('🔒 DÉSACTIVATION DU MODE DÉVELOPPEMENT');
    this.setEnvVar('DEV_MODE', 'false');
    this.setEnvVar('NODE_ENV', 'production');
    this.setEnvVar('ALLOW_DEBUG', 'false');
    this.saveEnv(this.envContent);
    console.log('✅ Mode production activé - redémarrez le serveur');
  }

  debugOn() {
    console.log('🐛 ACTIVATION DU DEBUG SÉCURITÉ');
    this.setEnvVar('ALLOW_DEBUG', 'true');
    this.saveEnv(this.envContent);
    console.log('✅ Debug activé - endpoint /auth/debug disponible');
  }

  debugOff() {
    console.log('🔇 DÉSACTIVATION DU DEBUG SÉCURITÉ');
    this.setEnvVar('ALLOW_DEBUG', 'false');
    this.saveEnv(this.envContent);
    console.log('✅ Debug désactivé');
  }

  async testAuth() {
    console.log('🧪 TEST DU SYSTÈME D\'AUTHENTIFICATION\n');

    try {
      // Test 1: Login
      console.log('📝 Test 1: Login avec admin credentials');
      const loginResponse = execSync(
        `curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"admin.genesis@erp.com","password":"SuperPassword123!"}'`,
        { encoding: 'utf8' }
      );

      if (loginResponse.includes('access_token')) {
        console.log('✅ Login réussi');
      } else {
        console.log('❌ Login échoué');
        console.log('Réponse:', loginResponse);
        return;
      }

      // Test 2: Profile protégé
      console.log('\n📝 Test 2: Accès route protégée');
      const profileResponse = execSync(
        `curl -s http://localhost:3001/auth/profile -H "Authorization: Bearer ${JSON.parse(loginResponse).access_token}"`,
        { encoding: 'utf8' }
      );

      if (profileResponse.includes('email')) {
        console.log('✅ Accès protégé réussi');
      } else {
        console.log('❌ Accès protégé échoué');
        console.log('Réponse:', profileResponse);
      }

      console.log('\n🎉 Tests terminés avec succès!');

    } catch (error) {
      console.log('❌ Erreur lors des tests:', error.message);
      console.log('\n💡 Assurez-vous que le serveur backend tourne sur le port 3001');
    }
  }

  resetDb() {
    console.log('🗑️ RÉINITIALISATION DE LA BASE DE DONNÉES SÉCURITÉ');

    try {
      console.log('Suppression des tokens de refresh...');
      execSync('npx prisma db execute --file scripts/reset-security.sql', { stdio: 'inherit' });
      console.log('✅ Base de données sécurité réinitialisée');
    } catch (error) {
      console.log('❌ Erreur lors de la réinitialisation:', error.message);
      console.log('💡 Assurez-vous que Prisma est configuré et que la DB est accessible');
    }
  }
}

// Fonction principale
function main() {
  const controller = new SecurityController();
  const command = process.argv[2];

  switch (command) {
    case 'status':
      controller.status();
      break;
    case 'dev-on':
      controller.devOn();
      break;
    case 'dev-off':
      controller.devOff();
      break;
    case 'debug-on':
      controller.debugOn();
      break;
    case 'debug-off':
      controller.debugOff();
      break;
    case 'test-auth':
      controller.testAuth();
      break;
    case 'reset-db':
      controller.resetDb();
      break;
    default:
      console.log('🔧 SECURITY CONTROL - Genesis ERP\n');
      console.log('Usage: node security-control.js [command]\n');
      console.log('Commands:');
      console.log('  status     Affiche l\'état de la sécurité');
      console.log('  dev-on     Active le mode développement');
      console.log('  dev-off    Désactive le mode développement');
      console.log('  debug-on   Active le debug sécurité');
      console.log('  debug-off  Désactive le debug sécurité');
      console.log('  test-auth  Test complet de l\'authentification');
      console.log('  reset-db   Réinitialise la DB sécurité');
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = SecurityController;