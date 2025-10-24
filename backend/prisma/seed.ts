import { PrismaClient, Role as PrismaRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...` );

  // 1. Hacher le mot de passe de l'administrateur
  const hashedPassword = await bcrypt.hash('SuperPassword123!', 10);

  // 2. Créer les rôles de base s'ils n'existent pas
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator with all permissions' },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: { name: 'CASHIER', description: 'Cashier with POS access' },
  });

  // 3. Créer l'utilisateur administrateur principal
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.genesis@erp.com' },
    update: {},
    create: {
      email: 'admin.genesis@erp.com',
      name: 'Admin Genesis',
      password: hashedPassword,
      roles: {
        connect: { id: adminRole.id }, // Lui assigner le rôle ADMIN
      },
    },
  });

  console.log(`Seeding finished.` );
  console.log(`Created admin user: ${adminUser.email}` );
  console.log(`Created roles: ${adminRole.name}, ${cashierRole.name}` );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
