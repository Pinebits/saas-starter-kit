# Test Users Script Documentation

This directory contains scripts for creating test data in the SaaS Starter Kit.

## 🚀 Quick Start

To create all test users and tenants:

```bash
npm run create-test-users
```

## 👥 Test User Personas

The script creates realistic test users representing different types of personas that would use a SaaS platform:

### 🔐 Master Administrators
Global system administrators with full access to all tenants and system settings.

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@saas-starter.com` | `admin123!` | Master Admin | System administrator with full access |
| `platform@saas-starter.com` | `platform123!` | Master Admin | Platform-level administrator |

### 🏢 Tenant Owners (Company Founders/CEOs)
Company founders and executives who own their organizations on the platform.

| Email | Password | Company | Role | Description |
|-------|----------|---------|------|-------------|
| `sarah@startupcorp.com` | `startup123!` | StartupCorp | Owner | CEO and founder of tech startup |
| `marcus@innovateinc.com` | `innovate123!` | InnovateInc | Owner | Founder of consulting company |
| `priya@techsolutions.com` | `tech123!` | TechSolutions | Owner | CTO of software development company |

### 👨‍💼 Tenant Admins (Department Heads/Managers)
Department heads and managers who have administrative access within their organizations.

| Email | Password | Company | Role | Description |
|-------|----------|---------|------|-------------|
| `david@startupcorp.com` | `startup123!` | StartupCorp | Admin | Engineering Manager |
| `lisa@innovateinc.com` | `innovate123!` | InnovateInc | Admin | Operations Director |
| `alex@techsolutions.com` | `tech123!` | TechSolutions | Admin | Product Manager |

### 👩‍💻 Regular Members (Employees/Developers)
Regular employees and team members with standard access to their organization's resources.

| Email | Password | Company | Role | Description |
|-------|----------|---------|------|-------------|
| `emma@startupcorp.com` | `startup123!` | StartupCorp | Member | Frontend Developer |
| `james@startupcorp.com` | `startup123!` | StartupCorp | Member | Backend Developer |
| `maria@innovateinc.com` | `innovate123!` | InnovateInc | Member | Business Analyst |
| `tom@innovateinc.com` | `innovate123!` | InnovateInc | Member | Project Manager |
| `rachel@techsolutions.com` | `tech123!` | TechSolutions | Member | UX Designer |
| `kevin@techsolutions.com` | `tech123!` | TechSolutions | Member | DevOps Engineer |

### 🧪 Demo Users (Testing Scenarios)
Special users for testing different scenarios and edge cases.

| Email | Password | Company | Role | Description |
|-------|----------|---------|------|-------------|
| `demo@saas-starter.com` | `demo123!` | Demo Company | Owner | Demo user for basic functionality |
| `testadmin@saas-starter.com` | `test123!` | Demo Company | Admin | Test admin for admin features |
| `guest@saas-starter.com` | `guest123!` | Demo Company | Member | Guest user with limited permissions |

## 🏢 Test Tenants

The script creates four test organizations:

1. **StartupCorp** (`startupcorp`) - Tech startup with 4 members
2. **InnovateInc** (`innovateinc`) - Consulting company with 4 members  
3. **TechSolutions** (`techsolutions`) - Software development company with 4 members
4. **Demo Company** (`demo-company`) - Demo organization with 3 members

## 🔑 Access Credentials

### Master Administrator Access
- **URL**: `/admin`
- **Credentials**: `admin@saas-starter.com` / `admin123!`
- **Capabilities**: Full system access, manage all tenants, view audit logs

### Tenant Owner Access
- **URL**: `/tenants/[slug]`
- **Example**: `sarah@startupcorp.com` / `startup123!` → `/tenants/startupcorp`
- **Capabilities**: Full tenant management, invite members, configure settings

### Tenant Admin Access
- **URL**: `/tenants/[slug]/settings`
- **Example**: `david@startupcorp.com` / `startup123!` → Manage StartupCorp
- **Capabilities**: Manage team members, configure tenant settings

### Regular Member Access
- **URL**: `/dashboard`
- **Example**: `emma@startupcorp.com` / `startup123!` → Access StartupCorp resources
- **Capabilities**: View tenant resources, collaborate with team

## 🧪 Testing Scenarios

### 1. **Role-Based Access Control (RBAC)**
- Test different permission levels across roles
- Verify tenant isolation and access controls
- Test master admin privileges

### 2. **Multi-Tenant Operations**
- Create and manage multiple organizations
- Test tenant switching and context isolation
- Verify billing and subscription management

### 3. **User Management**
- Invite new members to tenants
- Test role changes and permission updates
- Verify user onboarding workflows

### 4. **API Key Management**
- Test API key creation and management
- Verify tenant-scoped API access
- Test API key expiration and rotation

### 5. **Audit Logging**
- Test audit trail for user actions
- Verify compliance and security logging
- Test audit log filtering and export

## 🚨 Security Notes

- **Passwords are hashed** using bcrypt with salt rounds 10
- **Test data only** - Do not use these credentials in production
- **Email verification** is automatically set for test users
- **Session management** follows NextAuth.js best practices

## 🔄 Resetting Test Data

To reset all test data and start fresh:

```bash
# Clear the database (WARNING: This will delete ALL data)
npx prisma db push --force-reset

# Re-run the test user creation script
npm run create-test-users
```

## 📝 Customization

You can modify the `scripts/create-test-users.js` file to:

- Add more user personas
- Change company structures
- Modify role assignments
- Add custom test data
- Adjust password policies

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running: `docker-compose up -d`
   - Verify database schema: `npx prisma db push`

2. **User Creation Fails**
   - Check if users already exist
   - Verify email uniqueness constraints
   - Check database permissions

3. **Tenant Assignment Fails**
   - Ensure users and tenants are created first
   - Verify tenant slug uniqueness
   - Check role enum values

### Debug Mode

Run with verbose logging:

```bash
DEBUG=* npm run create-test-users
```

## 📚 Related Documentation

- [SaaS Starter Kit README](../README.md)
- [Prisma Schema](../prisma/schema.prisma)
- [Authentication Setup](../lib/nextAuth.ts)
- [Role-Based Access Control](../lib/rbac.ts)
