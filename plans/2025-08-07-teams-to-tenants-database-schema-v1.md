# Teams to Tenants: Database Schema Migration Plan

## Objective
Define a comprehensive database schema migration plan to transform the current Teams concept into a Tenants model with full multi-tenancy support, including role modifications to support master administrators.

## Current Schema Analysis

The current schema uses:
- `Team` model for organizations
- `TeamMember` for user membership in teams
- `Role` enum with ADMIN, OWNER, MEMBER roles
- Related models like `Invitation`, `ApiKey`, etc. that reference teams

## Proposed Schema Changes

### 1. Core Model Renaming

```prisma
// From
model Team {
  id              String       @id @default(uuid())
  name            String
  slug            String       @unique
  domain          String?      @unique
  defaultRole     Role         @default(MEMBER)
  billingId       String?
  billingProvider String?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @default(now())
  members         TeamMember[]
  invitations     Invitation[]
  apiKeys         ApiKey[]
}

// To
model Tenant {
  id              String         @id @default(uuid())
  name            String
  slug            String         @unique
  domain          String?        @unique
  defaultRole     Role           @default(MEMBER)
  billingId       String?
  billingProvider String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @default(now())
  members         TenantMember[]
  invitations     Invitation[]
  apiKeys         ApiKey[]
}
```

### 2. Member Relationship Updates

```prisma
// From
model TeamMember {
  id        String   @id @default(uuid())
  teamId    String
  userId    String
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([userId])
}

// To
model TenantMember {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userId])
  @@index([userId])
}
```

### 3. Role Enum Extension

```prisma
// From
enum Role {
  ADMIN
  OWNER
  MEMBER
}

// To
enum Role {
  MASTER_ADMIN // New global administrator role
  ADMIN
  OWNER
  MEMBER
}
```

### 4. User Model Update

```prisma
// From
model User {
  id                     String      @id @default(uuid())
  name                   String
  email                  String      @unique
  emailVerified          DateTime?
  password               String?
  image                  String?
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @default(now())
  invalid_login_attempts Int         @default(0)
  lockedAt               DateTime?

  teamMembers TeamMember[]
  accounts    Account[]
  sessions    Session[]
  invitations Invitation[]
}

// To
model User {
  id                     String         @id @default(uuid())
  name                   String
  email                  String         @unique
  emailVerified          DateTime?
  password               String?
  image                  String?
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @default(now())
  invalid_login_attempts Int            @default(0)
  lockedAt               DateTime?
  isMasterAdmin          Boolean        @default(false) // New field for master admin flag

  tenantMembers TenantMember[]
  accounts      Account[]
  sessions      Session[]
  invitations   Invitation[]
}
```

### 5. Invitation Model Update

```prisma
// From
model Invitation {
  id             String   @id @default(uuid())
  teamId         String
  email          String?
  role           Role     @default(MEMBER)
  token          String   @unique
  expires        DateTime
  invitedBy      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @default(now())
  sentViaEmail   Boolean  @default(true)
  allowedDomains String[] @default([])

  user User @relation(fields: [invitedBy], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([teamId, email])
  @@index([email])
}

// To
model Invitation {
  id             String   @id @default(uuid())
  tenantId       String
  email          String?
  role           Role     @default(MEMBER)
  token          String   @unique
  expires        DateTime
  invitedBy      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @default(now())
  sentViaEmail   Boolean  @default(true)
  allowedDomains String[] @default([])

  user   User   @relation(fields: [invitedBy], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, email])
  @@index([email])
}
```

### 6. API Key Model Update

```prisma
// From
model ApiKey {
  id         String    @id @default(uuid())
  name       String
  teamId     String
  hashedKey  String    @unique
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @default(now())
  expiresAt  DateTime?
  lastUsedAt DateTime?

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId])
}

// To
model ApiKey {
  id         String    @id @default(uuid())
  name       String
  tenantId   String
  hashedKey  String    @unique
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @default(now())
  expiresAt  DateTime?
  lastUsedAt DateTime?

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}
```

## Migration Strategy

1. **Create New Models**
   - Generate a migration that adds the new Tenant and TenantMember models without dropping the existing ones
   - Add the isMasterAdmin field to User model

2. **Data Transfer**
   - Create a script to copy data from Team to Tenant and TeamMember to TenantMember
   - Designate initial master administrators

3. **Update References**
   - Update all foreign key references in related models (Invitation, ApiKey, etc.)

4. **Validation**
   - Verify data integrity after migration
   - Confirm all relationships are maintained

5. **Cleanup**
   - Once validation is complete, create a migration to drop the original Team and TeamMember models

## Implementation Considerations

1. **Database Downtime**
   - Estimate: 15-30 minutes for schema changes and data migration
   - Schedule during low-traffic period

2. **Rollback Plan**
   - Maintain backup of all data before migration
   - Create reverse migration scripts for immediate rollback if needed

3. **Data Integrity Checks**
   - Compare record counts between old and new tables
   - Verify foreign key relationships
   - Test critical queries with the new schema

4. **Performance Optimization**
   - Create appropriate indexes on the new tables
   - Test query performance before and after migration

## Testing Plan

1. **Pre-Migration Testing**
   - Create a staging environment with production data
   - Execute migration script and verify results
   - Perform application functionality tests with the new schema

2. **Post-Migration Testing**
   - Verify all tenant-related functionality
   - Test master admin capabilities
   - Confirm regular users cannot modify tenant membership

3. **Load Testing**
   - Simulate high-traffic scenarios to ensure performance with the new schema
   - Focus on common tenant-related operations

## Master Admin Implementation

1. **Interface Controls**
   - Create dedicated UI for master admins to manage tenants
   - Implement tenant creation, user assignment, and membership management

2. **Access Control**
   - Implement middleware that checks the isMasterAdmin flag
   - Add route protection for tenant management endpoints

3. **Audit Logging**
   - Add comprehensive logging for all tenant management operations
   - Track who made changes and when

4. **Security Considerations**
   - Implement additional authentication for critical tenant operations
   - Consider requiring re-authentication for sensitive actions