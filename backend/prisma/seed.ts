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

  await prisma.role.upsert({
    where: { name: 'Caissier' },
    update: {},
    create: { name: 'Caissier', description: 'Caissier avec accès POS' },
  });
  console.log('Roles created/verified.');

  // 3. Associer toutes les permissions au rôle ADMIN
  const allPermissions = await prisma.permission.findMany();
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });
  console.log('All permissions assigned to ADMIN role.');

  // 4. Créer l'utilisateur administrateur principal
  const hashedPassword = await bcrypt.hash('SuperPassword123!', 10);
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
