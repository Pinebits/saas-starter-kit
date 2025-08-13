#!/usr/bin/env node

/**
 * Test Users Creation Script for SaaS Starter Kit
 * 
 * This script creates test users representing different personas:
 * - Master Administrators (Global system admins)
 * - Tenant Owners (Company founders/CEOs)
 * - Tenant Admins (Department heads/Managers)
 * - Regular Members (Employees/Users)
 * - Demo Users (For testing different scenarios)
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test user data representing different personas
const testUsers = [
  // ===== MASTER ADMINISTRATORS =====
  {
    name: 'System Administrator',
    email: 'admin@saas-starter.com',
    password: 'admin123!',
    isMasterAdmin: true,
    description: 'Global system administrator with full access to all tenants and system settings'
  },
  {
    name: 'Platform Manager',
    email: 'platform@saas-starter.com',
    password: 'platform123!',
    isMasterAdmin: true,
    description: 'Platform-level administrator responsible for system-wide configurations'
  },

  // ===== TENANT OWNERS (Startup/Company Founders) =====
  {
    name: 'Sarah Chen',
    email: 'sarah@startupcorp.com',
    password: 'startup123!',
    isMasterAdmin: false,
    description: 'CEO and founder of StartupCorp, a tech startup using the platform'
  },
  {
    name: 'Marcus Rodriguez',
    email: 'marcus@innovateinc.com',
    password: 'innovate123!',
    isMasterAdmin: false,
    description: 'Founder of InnovateInc, a consulting company'
  },
  {
    name: 'Priya Patel',
    email: 'priya@techsolutions.com',
    password: 'tech123!',
    isMasterAdmin: false,
    description: 'CTO of TechSolutions, a software development company'
  },

  // ===== TENANT ADMINS (Department Heads/Managers) =====
  {
    name: 'David Kim',
    email: 'david@startupcorp.com',
    password: 'startup123!',
    isMasterAdmin: false,
    description: 'Engineering Manager at StartupCorp, manages development team'
  },
  {
    name: 'Lisa Thompson',
    email: 'lisa@innovateinc.com',
    password: 'innovate123!',
    isMasterAdmin: false,
    description: 'Operations Director at InnovateInc, manages client projects'
  },
  {
    name: 'Alex Johnson',
    email: 'alex@techsolutions.com',
    password: 'tech123!',
    isMasterAdmin: false,
    description: 'Product Manager at TechSolutions, manages product development'
  },

  // ===== REGULAR MEMBERS (Employees/Developers) =====
  {
    name: 'Emma Wilson',
    email: 'emma@startupcorp.com',
    password: 'startup123!',
    isMasterAdmin: false,
    description: 'Frontend Developer at StartupCorp, works on user interface'
  },
  {
    name: 'James Lee',
    email: 'james@startupcorp.com',
    password: 'startup123!',
    isMasterAdmin: false,
    description: 'Backend Developer at StartupCorp, works on API development'
  },
  {
    name: 'Maria Garcia',
    email: 'maria@innovateinc.com',
    password: 'innovate123!',
    isMasterAdmin: false,
    description: 'Business Analyst at InnovateInc, works on client requirements'
  },
  {
    name: 'Tom Anderson',
    email: 'tom@innovateinc.com',
    password: 'innovate123!',
    isMasterAdmin: false,
    description: 'Project Manager at InnovateInc, manages client deliverables'
  },
  {
    name: 'Rachel Green',
    email: 'rachel@techsolutions.com',
    password: 'tech123!',
    isMasterAdmin: false,
    description: 'UX Designer at TechSolutions, designs user experiences'
  },
  {
    name: 'Kevin Brown',
    email: 'kevin@techsolutions.com',
    password: 'tech123!',
    isMasterAdmin: false,
    description: 'DevOps Engineer at TechSolutions, manages infrastructure'
  },

  // ===== DEMO USERS (For testing different scenarios) =====
  {
    name: 'Demo User',
    email: 'demo@saas-starter.com',
    password: 'demo123!',
    isMasterAdmin: false,
    description: 'Demo user for testing basic functionality'
  },
  {
    name: 'Test Admin',
    email: 'testadmin@saas-starter.com',
    password: 'test123!',
    isMasterAdmin: false,
    description: 'Test admin user for testing admin features'
  },
  {
    name: 'Guest User',
    email: 'guest@saas-starter.com',
    password: 'guest123!',
    isMasterAdmin: false,
    description: 'Guest user with limited permissions for testing'
  }
];

// Test tenant data
const testTenants = [
  {
    name: 'StartupCorp',
    slug: 'startupcorp',
    domain: 'startupcorp.com',
    description: 'Tech startup focused on innovative solutions'
  },
  {
    name: 'InnovateInc',
    slug: 'innovateinc',
    domain: 'innovateinc.com',
    description: 'Consulting company specializing in business innovation'
  },
  {
    name: 'TechSolutions',
    slug: 'techsolutions',
    domain: 'techsolutions.com',
    description: 'Software development company building enterprise solutions'
  },
  {
    name: 'Demo Company',
    slug: 'demo-company',
    domain: 'demo-company.com',
    description: 'Demo company for testing purposes'
  }
];

// Tenant member assignments with roles
const tenantMembers = [
  // StartupCorp members
  { tenantSlug: 'startupcorp', userEmail: 'sarah@startupcorp.com', role: 'OWNER' },
  { tenantSlug: 'startupcorp', userEmail: 'david@startupcorp.com', role: 'ADMIN' },
  { tenantSlug: 'startupcorp', userEmail: 'emma@startupcorp.com', role: 'MEMBER' },
  { tenantSlug: 'startupcorp', userEmail: 'james@startupcorp.com', role: 'MEMBER' },

  // InnovateInc members
  { tenantSlug: 'innovateinc', userEmail: 'marcus@innovateinc.com', role: 'OWNER' },
  { tenantSlug: 'innovateinc', userEmail: 'lisa@innovateinc.com', role: 'ADMIN' },
  { tenantSlug: 'innovateinc', userEmail: 'maria@innovateinc.com', role: 'MEMBER' },
  { tenantSlug: 'innovateinc', userEmail: 'tom@innovateinc.com', role: 'MEMBER' },

  // TechSolutions members
  { tenantSlug: 'techsolutions', userEmail: 'priya@techsolutions.com', role: 'OWNER' },
  { tenantSlug: 'techsolutions', userEmail: 'alex@techsolutions.com', role: 'ADMIN' },
  { tenantSlug: 'techsolutions', userEmail: 'rachel@techsolutions.com', role: 'MEMBER' },
  { tenantSlug: 'techsolutions', userEmail: 'kevin@techsolutions.com', role: 'MEMBER' },

  // Demo Company members
  { tenantSlug: 'demo-company', userEmail: 'demo@saas-starter.com', role: 'OWNER' },
  { tenantSlug: 'demo-company', userEmail: 'testadmin@saas-starter.com', role: 'ADMIN' },
  { tenantSlug: 'demo-company', userEmail: 'guest@saas-starter.com', role: 'MEMBER' },
  
  // Master Admin users (need access to at least one tenant)
  { tenantSlug: 'demo-company', userEmail: 'admin@saas-starter.com', role: 'OWNER' },
  { tenantSlug: 'demo-company', userEmail: 'platform@saas-starter.com', role: 'ADMIN' }
];

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function createUsers() {
  console.log('🚀 Creating test users...');
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    try {
      const hashedPassword = await hashPassword(userData.password);
      
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          password: hashedPassword,
          isMasterAdmin: userData.isMasterAdmin,
          updatedAt: new Date()
        },
        create: {
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          isMasterAdmin: userData.isMasterAdmin,
          emailVerified: new Date()
        }
      });
      
      createdUsers.push(user);
      console.log(`✅ Created/Updated user: ${user.name} (${user.email}) - Master Admin: ${user.isMasterAdmin}`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  return createdUsers;
}

async function createTenants() {
  console.log('\n🏢 Creating test tenants...');
  
  const createdTenants = [];
  
  for (const tenantData of testTenants) {
    try {
      const tenant = await prisma.tenant.upsert({
        where: { slug: tenantData.slug },
        update: {
          name: tenantData.name,
          domain: tenantData.domain,
          updatedAt: new Date()
        },
        create: {
          name: tenantData.name,
          slug: tenantData.slug,
          domain: tenantData.domain
        }
      });
      
      createdTenants.push(tenant);
      console.log(`✅ Created/Updated tenant: ${tenant.name} (${tenant.slug})`);
    } catch (error) {
      console.error(`❌ Error creating tenant ${tenantData.slug}:`, error.message);
    }
  }
  
  return createdTenants;
}

async function assignTenantMembers() {
  console.log('\n👥 Assigning users to tenants...');
  
  for (const memberData of tenantMembers) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: memberData.userEmail }
      });
      
      const tenant = await prisma.tenant.findUnique({
        where: { slug: memberData.tenantSlug }
      });
      
      if (!user || !tenant) {
        console.warn(`⚠️  Skipping member assignment: User or tenant not found for ${memberData.userEmail} in ${memberData.tenantSlug}`);
        continue;
      }
      
      await prisma.tenantMember.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: user.id
          }
        },
        update: {
          role: memberData.role,
          updatedAt: new Date()
        },
        create: {
          tenantId: tenant.id,
          userId: user.id,
          role: memberData.role
        }
      });
      
      console.log(`✅ Assigned ${user.name} as ${memberData.role} in ${tenant.name}`);
    } catch (error) {
      console.error(`❌ Error assigning member ${memberData.userEmail} to ${memberData.tenantSlug}:`, error.message);
    }
  }
}

async function createSampleData() {
  console.log('\n📊 Creating sample data...');
  
  try {
    // Create some sample API keys for demo purposes
    const demoTenant = await prisma.tenant.findUnique({
      where: { slug: 'demo-company' }
    });
    
    if (demoTenant) {
      await prisma.apiKey.upsert({
        where: { hashedKey: 'demo-api-key-123' },
        update: {},
        create: {
          name: 'Demo API Key',
          tenantId: demoTenant.id,
          hashedKey: 'demo-api-key-123',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
        }
      });
      console.log('✅ Created demo API key');
    }
    
    // Create some sample audit log entries
    const masterAdmin = await prisma.user.findFirst({
      where: { isMasterAdmin: true }
    });
    
    if (masterAdmin) {
      await prisma.adminAuditLog.create({
        data: {
          userId: masterAdmin.id,
          action: 'CREATE_TEST_USERS',
          targetType: 'SYSTEM',
          targetId: 'test-users-creation',
          details: {
            timestamp: new Date().toISOString(),
            description: 'Test users created via script'
          }
        }
      });
      console.log('✅ Created sample audit log entry');
    }
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
  }
}

async function main() {
  try {
    console.log('🎯 SaaS Starter Kit - Test Users Creation Script');
    console.log('================================================\n');
    
    // Create users
    const users = await createUsers();
    
    // Create tenants
    const tenants = await createTenants();
    
    // Assign users to tenants
    await assignTenantMembers();
    
    // Create sample data
    await createSampleData();
    
    console.log('\n🎉 Test data creation completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   • Users created: ${users.length}`);
    console.log(`   • Tenants created: ${tenants.length}`);
    console.log(`   • Master Administrators: ${users.filter(u => u.isMasterAdmin).length}`);
    
    console.log('\n🔑 Test User Credentials:');
    console.log('   Master Admin: admin@saas-starter.com / admin123!');
    console.log('   Demo User: demo@saas-starter.com / demo123!');
    console.log('   StartupCorp Owner: sarah@startupcorp.com / startup123!');
    console.log('   InnovateInc Owner: marcus@innovateinc.com / innovate123!');
    console.log('   TechSolutions Owner: priya@techsolutions.com / tech123!');
    
    console.log('\n🌐 Access your application at: http://localhost:4002');
    console.log('   Use the credentials above to test different user roles and permissions.');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { createTestUsers: main };
