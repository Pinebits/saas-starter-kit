// Migration script to convert Teams to Tenants
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateTeamsToTenants() {
  console.log('Starting migration from Teams to Tenants...');

  try {
    // Step 1: Get all teams
    console.log('Fetching existing teams...');
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        },
        invitations: true,
        apiKeys: true
      }
    });
    console.log(`Found ${teams.length} teams to migrate`);

    // Step 2: For each team, create a tenant
    for (const team of teams) {
      console.log(`Migrating team: ${team.name} (${team.id})`);
      
      // Create tenant record
      const tenant = await prisma.tenant.create({
        data: {
          id: team.id, // Preserve the same ID
          name: team.name,
          slug: team.slug,
          domain: team.domain,
          defaultRole: team.defaultRole,
          billingId: team.billingId,
          billingProvider: team.billingProvider,
          createdAt: team.createdAt,
          updatedAt: team.updatedAt
        }
      });
      
      console.log(`Created tenant: ${tenant.name} (${tenant.id})`);
      
      // Step 3: Migrate team members to tenant members
      console.log(`Migrating ${team.members.length} team members...`);
      for (const member of team.members) {
        await prisma.tenantMember.create({
          data: {
            id: member.id, // Preserve the same ID
            tenantId: tenant.id,
            userId: member.userId,
            role: member.role,
            createdAt: member.createdAt,
            updatedAt: member.updatedAt
          }
        });
      }
      
      // Step 4: Migrate invitations
      console.log(`Migrating ${team.invitations.length} invitations...`);
      for (const invitation of team.invitations) {
        await prisma.invitation.create({
          data: {
            id: invitation.id, // Preserve the same ID
            tenantId: tenant.id,
            email: invitation.email,
            role: invitation.role,
            token: invitation.token,
            expires: invitation.expires,
            invitedBy: invitation.invitedBy,
            createdAt: invitation.createdAt,
            updatedAt: invitation.updatedAt,
            sentViaEmail: invitation.sentViaEmail,
            allowedDomains: invitation.allowedDomains
          }
        });
      }
      
      // Step 5: Migrate API keys
      console.log(`Migrating ${team.apiKeys.length} API keys...`);
      for (const apiKey of team.apiKeys) {
        await prisma.apiKey.create({
          data: {
            id: apiKey.id, // Preserve the same ID
            name: apiKey.name,
            tenantId: tenant.id,
            hashedKey: apiKey.hashedKey,
            createdAt: apiKey.createdAt,
            updatedAt: apiKey.updatedAt,
            expiresAt: apiKey.expiresAt,
            lastUsedAt: apiKey.lastUsedAt
          }
        });
      }
      
      console.log(`Successfully migrated team: ${team.name}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
}

async function designateMasterAdmin(email) {
  try {
    console.log(`Designating user with email ${email} as Master Administrator...`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { isMasterAdmin: true }
    });
    
    console.log(`User ${user.name} (${user.email}) has been designated as Master Administrator.`);
  } catch (error) {
    console.error('Error designating master admin:', error);
    throw error;
  }
}

async function main() {
  try {
    if (process.argv.length < 3) {
      console.log(`
        Usage: 
          node migrate-teams-to-tenants.js <admin-email>
          
        Example: 
          node migrate-teams-to-tenants.js admin@example.com
      `);
      process.exit(1);
    }
    
    const adminEmail = process.argv[2];
    
    // First migrate teams to tenants
    await migrateTeamsToTenants();
    
    // Then designate a master admin
    await designateMasterAdmin(adminEmail);
    
    console.log('Migration process completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();