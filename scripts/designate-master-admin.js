// Script to designate a user as a Master Administrator
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function designateMasterAdmin(email) {
  try {
    console.log(`Checking if user with email ${email} exists...`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Check if already a master admin
    if (user.isMasterAdmin) {
      console.log(`User ${user.name} is already a Master Administrator.`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isMasterAdmin: true },
    });

    console.log(`User ${user.name} (${user.email}) has been designated as a Master Administrator.`);
    
    // Add an audit log entry
    await prisma.adminAuditLog.create({
      data: {
        userId: user.id, // self-designation as this is the script
        action: 'MASTER_ADMIN_DESIGNATION',
        targetType: 'USER',
        targetId: user.id,
        details: { 
          email: user.email,
          name: user.name,
          designatedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('Audit log created for this action.');
  } catch (error) {
    console.error('Error designating master admin:', error);
    throw error;
  }
}

async function revokeMasterAdmin(email) {
  try {
    console.log(`Checking if user with email ${email} exists...`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Check if already not a master admin
    if (!user.isMasterAdmin) {
      console.log(`User ${user.name} is not a Master Administrator.`);
      return;
    }

    // Count the number of master admins
    const masterAdminCount = await prisma.user.count({
      where: { isMasterAdmin: true }
    });

    if (masterAdminCount <= 1) {
      console.log('Cannot revoke the last Master Administrator. Designate another user as Master Administrator first.');
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isMasterAdmin: false },
    });

    console.log(`Master Administrator rights have been revoked from ${user.name} (${user.email}).`);
    
    // Add an audit log entry (using a generic admin ID for now)
    const masterAdmins = await prisma.user.findMany({
      where: { isMasterAdmin: true },
      take: 1
    });
    
    await prisma.adminAuditLog.create({
      data: {
        userId: masterAdmins[0].id,
        action: 'MASTER_ADMIN_REVOCATION',
        targetType: 'USER',
        targetId: user.id,
        details: { 
          email: user.email,
          name: user.name,
          revokedAt: new Date().toISOString()
        }
      }
    });
    
    console.log('Audit log created for this action.');
  } catch (error) {
    console.error('Error revoking master admin:', error);
    throw error;
  }
}

function askForConfirmation(message) {
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  try {
    if (process.argv.length < 4) {
      console.log(`
        Usage: 
          node designate-master-admin.js <action> <email>
          
        Actions:
          designate - Designate a user as Master Administrator
          revoke - Revoke Master Administrator rights
          
        Example: 
          node designate-master-admin.js designate admin@example.com
          node designate-master-admin.js revoke admin@example.com
      `);
      process.exit(1);
    }
    
    const action = process.argv[2];
    const email = process.argv[3];
    
    if (action === 'designate') {
      const confirmed = await askForConfirmation(`Are you sure you want to designate ${email} as a Master Administrator?`);
      
      if (confirmed) {
        await designateMasterAdmin(email);
        console.log('Master Administrator designation completed successfully.');
      } else {
        console.log('Operation cancelled.');
      }
    } else if (action === 'revoke') {
      const confirmed = await askForConfirmation(`Are you sure you want to revoke Master Administrator rights from ${email}?`);
      
      if (confirmed) {
        await revokeMasterAdmin(email);
        console.log('Master Administrator revocation completed successfully.');
      } else {
        console.log('Operation cancelled.');
      }
    } else {
      console.log(`Invalid action: ${action}. Use 'designate' or 'revoke'.`);
    }
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();