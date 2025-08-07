import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create a master admin user
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: await hash("admin@123", 12),
      emailVerified: new Date(),
      isMasterAdmin: true
    }
  });
  console.log('Created master admin user:', adminUser.email);

  // Create a regular user
  const regularUser = await prisma.user.create({
    data: {
      name: "Regular User",
      email: "user@example.com",
      password: await hash("user@123", 12),
      emailVerified: new Date()
    }
  });
  console.log('Created regular user:', regularUser.email);

  // Create a tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: "Demo Organization",
      slug: "demo-organization"
    }
  });
  console.log('Created tenant:', tenant.name);

  // Add users to the tenant
  await prisma.tenantMember.create({
    data: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: Role.OWNER
    }
  });

  await prisma.tenantMember.create({
    data: {
      tenantId: tenant.id,
      userId: regularUser.id,
      role: Role.MEMBER
    }
  });
  console.log('Added users to tenant');

  // Create an audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: adminUser.id,
      action: 'CREATE_TENANT',
      targetType: 'TENANT',
      targetId: tenant.id,
      details: {
        name: tenant.name,
        timestamp: new Date().toISOString()
      }
    }
  });
  console.log('Created audit log entry');

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });