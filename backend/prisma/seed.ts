import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...` );

  // 1. Créer les permissions de base
  const permissionsToCreate = [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'product:create', 'product:read', 'product:update', 'product:delete',
    'stock:create', 'stock:read', 'stock:update', 'stock:delete', 'stock:adjust',
    'role:read', 'role:assign'
  ];

  for (const permName of permissionsToCreate) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: { name: permName },
    });
  }
  console.log('Permissions created/verified.');

  // 2. Créer les rôles de base
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrateur' },
    update: {},
    create: { name: 'Administrateur', description: 'Administrateur avec tous les droits' },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'Caissier' },
    update: {},
    create: { name: 'Caissier', description: 'Caissier avec accès POS' },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', description: 'Manager de magasin avec droits étendus' },
  });
  console.log('Roles created/verified.');

  // 3. Associer les permissions aux rôles
  const allPermissions = await prisma.permission.findMany();

  // ADMIN : toutes les permissions
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  // CASHIER : permissions limitées au POS et lecture
  const cashierPermissions = allPermissions.filter(p =>
    ['product:read', 'stock:read', 'stock:update', 'stock:adjust'].includes(p.name)
  );
  await prisma.role.update({
    where: { id: cashierRole.id },
    data: {
      permissions: {
        set: cashierPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  // MANAGER : permissions de gestion sans suppression utilisateurs
  const managerPermissions = allPermissions.filter(p =>
    !['user:delete'].includes(p.name)
  );
  await prisma.role.update({
    where: { id: managerRole.id },
    data: {
      permissions: {
        set: managerPermissions.map(p => ({ id: p.id })),
      },
    },
  });
  console.log('Permissions assigned to roles.');

  // 4. Créer les utilisateurs de test
  const hashedPassword = await bcrypt.hash('SuperPassword123!', 10);

  // Admin principal
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.genesis@erp.com' },
    update: {},
    create: {
      email: 'admin.genesis@erp.com',
      name: 'Admin Genesis',
      password: hashedPassword,
      roles: {
        connect: { id: adminRole.id },
      },
    },
  });
  console.log(`Admin user created/verified: ${adminUser.email}` );

  // Managers
  const managerUsers = [
    { email: 'manager.yaounde@genesis.com', name: 'Manager Yaoundé' },
    { email: 'manager.douala@genesis.com', name: 'Manager Douala' },
  ];

  for (const userData of managerUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        roles: {
          connect: { id: managerRole.id },
        },
      },
    });
  }
  console.log('Manager users created.');

  // Caissiers
  const cashierUsers = [
    { email: 'cashier.yaounde1@genesis.com', name: 'Caissier Yaoundé 1' },
    { email: 'cashier.yaounde2@genesis.com', name: 'Caissier Yaoundé 2' },
    { email: 'cashier.douala1@genesis.com', name: 'Caissier Douala 1' },
    { email: 'cashier.douala2@genesis.com', name: 'Caissier Douala 2' },
  ];

  for (const userData of cashierUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        roles: {
          connect: { id: cashierRole.id },
        },
      },
    });
  }
  console.log('Cashier users created.');

  // Utilisateurs sans rôles (pour tests)
  const regularUsers = [
    { email: 'user.test1@genesis.com', name: 'Utilisateur Test 1' },
    { email: 'user.test2@genesis.com', name: 'Utilisateur Test 2' },
  ];

  for (const userData of regularUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      },
    });
  }
  console.log('Regular users created.');

  // 5. Créer des produits de test (livres scolaires)
  const productsToCreate = [
    {
      name: 'Livre de Mathématiques Terminale C',
      sku: 'MATH-TER-C-001',
      price: 15000,
      cost: 12000,
      description: 'Manuel de mathématiques pour Terminale C - Programme MINEDUB 2025',
      barcode: '9781234567890',
    },
    {
      name: 'Cahier d\'Exercices Français 2nde',
      sku: 'FR-2NDE-EX-001',
      price: 8000,
      cost: 6000,
      description: 'Cahier d\'exercices de français pour Seconde - Méthode active',
      barcode: '9781234567891',
    },
    {
      name: 'Atlas Géographique Scolaire',
      sku: 'GEO-ATLAS-001',
      price: 25000,
      cost: 20000,
      description: 'Atlas géographique complet pour collège et lycée - Cartes Cameroun détaillées',
      barcode: '9781234567892',
    },
    {
      name: 'Manuel d\'Histoire CM2',
      sku: 'HIST-CM2-001',
      price: 12000,
      cost: 9500,
      description: 'Histoire du Cameroun et Afrique - Niveau CM2',
      barcode: '9781234567893',
    },
    {
      name: 'Cahier de Sciences Physiques 3ème',
      sku: 'PHYS-3EME-001',
      price: 9500,
      cost: 7500,
      description: 'Physique-Chimie pour classe de 3ème - Exercices pratiques',
      barcode: '9781234567894',
    },
    {
      name: 'Méthode Anglais Terminale',
      sku: 'ANG-TER-METH-001',
      price: 18000,
      cost: 14500,
      description: 'Méthode complète anglais Terminale - Préparation BAC',
      barcode: '9781234567895',
    },
    {
      name: 'Livre de Philosophie Terminale',
      sku: 'PHILO-TER-001',
      price: 16000,
      cost: 13000,
      description: 'Philosophie Terminale - Textes et exercices',
      barcode: '9781234567896',
    },
    {
      name: 'Cahier de Géométrie 1ère',
      sku: 'GEO-1ERE-001',
      price: 11000,
      cost: 8800,
      description: 'Géométrie pour Première - Construction et démonstration',
      barcode: '9781234567897',
    },
  ];

  for (const productData of productsToCreate) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });
  }
  console.log('Products created.');

  // 6. Créer des stocks de test
  const stores = ['Yaoundé Centre', 'Douala Bonanjo', 'Bafoussam'];

  for (const store of stores) {
    for (const product of productsToCreate.slice(0, 5)) { // 5 produits par magasin
      const quantity = Math.floor(Math.random() * 50) + 10; // 10-60 unités

      await prisma.stockLevel.upsert({
        where: {
          productId_location: {
            productId: (await prisma.product.findUnique({ where: { sku: product.sku } }))!.id,
            location: store,
          },
        },
        update: {},
        create: {
          productId: (await prisma.product.findUnique({ where: { sku: product.sku } }))!.id,
          location: store,
          quantity: quantity,
          minThreshold: 5,
        },
      });
    }
  }
  console.log('Stock levels created.');

  console.log(`Seeding finished.` );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
