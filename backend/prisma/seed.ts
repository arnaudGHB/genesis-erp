import { PrismaClient, Role as PrismaRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`🧹 Nettoyage de la base de données existante...`);
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.stockLevel.deleteMany({});

  console.log(`🌱 Démarrage du seeding...`);

  // --- 1. Création des Permissions ---
  const permissionsToCreate = [
    // User Permissions
    'user:create', 'user:read', 'user:update', 'user:delete',
    // Product Permissions
    'product:create', 'product:read', 'product:update', 'product:delete',
    // Stock Permissions
    'stock:read', 'stock:adjust',
    // Role & Permission Management
    'role:read', 'role:update',
    // POS Permissions
    'pos:use', 'pos:manage_sessions',
    // Reporting Permissions
    'reporting:view'
  ];

  for (const permName of permissionsToCreate) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName, description: `Permission to ${permName.replace(':', ' ')}` },
    });
  }
  console.log(`✅ ${permissionsToCreate.length} permissions créées/vérifiées.`);

  const allPermissions = await prisma.permission.findMany();
  const productReadPermission = allPermissions.find(p => p.name === 'product:read')!;
  const posUsePermission = allPermissions.find(p => p.name === 'pos:use')!;

  // --- 2. Création des Rôles ---
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Accès total à toutes les fonctionnalités du système.',
      permissions: { connect: allPermissions.map(p => ({ id: p.id })) },
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'MANAGER',
      description: 'Gère un point de vente : stocks, produits, et supervise les caissiers.',
      permissions: {
        connect: allPermissions
          .filter(p => p.name.startsWith('product:') || p.name.startsWith('stock:') || p.name === 'user:read' || p.name === 'pos:manage_sessions')
          .map(p => ({ id: p.id })),
      },
    },
  });

  const cashierRole = await prisma.role.create({
    data: {
      name: 'CASHIER',
      description: 'Utilise le Point de Vente pour effectuer les transactions.',
      permissions: { connect: [{ id: productReadPermission.id }, { id: posUsePermission.id }] },
    },
  });
  console.log(`✅ 3 rôles (ADMIN, MANAGER, CASHIER) créés avec leurs permissions.`);

  // --- 3. Création des Utilisateurs ---
  const hashedPasswordAdmin = await bcrypt.hash('SuperPassword123!', 10);
  await prisma.user.create({
    data: {
      email: 'admin.genesis@erp.com',
      name: 'Arnaud Nagué (Admin)',
      password: hashedPasswordAdmin,
      roles: { connect: { id: adminRole.id } },
    },
  });

  const hashedPasswordManager = await bcrypt.hash('ManagerPass123', 10);
  await prisma.user.create({
    data: {
      email: 'manager.yaounde@erp.com',
      name: 'Céline Mbia (Manager)',
      password: hashedPasswordManager,
      roles: { connect: { id: managerRole.id } },
    },
  });

  const hashedPasswordCashier = await bcrypt.hash('CashierPass123', 10);
  await prisma.user.create({
    data: {
      email: 'cashier.douala@erp.com',
      name: 'Jean Eboué (Caissier)',
      password: hashedPasswordCashier,
      roles: { connect: { id: cashierRole.id } },
    },
  });
  console.log(`✅ 3 utilisateurs de test créés.`);

  // --- 4. Création des Produits (Catalogue) ---
  const productsToCreate = [
    { name: 'Livre de Mathématiques - Terminale C', sku: 'LIV-MATH-TC', price: 7500, cost: 5000 },
    { name: 'Livre de Physique-Chimie - Terminale D', sku: 'LIV-PC-TD', price: 8000, cost: 5500 },
    { name: 'Cahier de 200 Pages - Grand Format', sku: 'CAH-200-GF', price: 1500, cost: 900 },
    { name: 'Stylo à Bille Bleu - Bic', sku: 'STY-BIC-BL', price: 150, cost: 80 },
    { name: 'Ensemble Géométrique (Règle, Equerre, Compas)', sku: 'SET-GEO-01', price: 2500, cost: 1600 },
  ];

  for (const productData of productsToCreate) {
    await prisma.product.create({ data: productData });
  }
  console.log(`✅ ${productsToCreate.length} produits créés.`);

  const mathBook = await prisma.product.findUnique({ where: { sku: 'LIV-MATH-TC' } });
  const pcBook = await prisma.product.findUnique({ where: { sku: 'LIV-PC-TD' } });
  const notebook = await prisma.product.findUnique({ where: { sku: 'CAH-200-GF' } });

  // --- 5. Création des Niveaux de Stock ---
  if (mathBook) {
    await prisma.stockLevel.create({ data: { productId: mathBook.id, location: 'Magasin Yaoundé', quantity: 150 } });
    await prisma.stockLevel.create({ data: { productId: mathBook.id, location: 'Entrepôt Douala', quantity: 500 } });
  }
  if (pcBook) {
    await prisma.stockLevel.create({ data: { productId: pcBook.id, location: 'Magasin Yaoundé', quantity: 120 } });
  }
  if (notebook) {
    await prisma.stockLevel.create({ data: { productId: notebook.id, location: 'Magasin Yaoundé', quantity: 800 } });
    await prisma.stockLevel.create({ data: { productId: notebook.id, location: 'Entrepôt Douala', quantity: 2000 } });
  }
  console.log(`✅ Niveaux de stock initiaux créés pour 3 produits sur 2 emplacements.`);

  console.log(`🎉 Seeding terminé avec succès !`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
