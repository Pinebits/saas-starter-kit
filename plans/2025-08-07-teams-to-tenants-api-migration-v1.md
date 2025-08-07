# Teams to Tenants: API and Service Layer Migration Plan

## Objective
Define a comprehensive plan for migrating the API and service layer from Teams to Tenants, ensuring all functionality continues to work while implementing the new master administrator role and multi-tenant access controls.

## Current API Analysis

The current implementation includes:
- Team creation, management, and member operations in `models/team.ts`
- Team member management in `models/teamMember.ts`
- Authentication guards for team access
- Various API endpoints for team operations

## API Migration Strategy

### 1. Core Model Functions Refactoring

#### Team Model to Tenant Model

```typescript
// FROM: models/team.ts
export const createTeam = async (param: {
  userId: string;
  name: string;
  slug: string;
}) => {
  // Implementation
};

// TO: models/tenant.ts
export const createTenant = async (param: {
  createdByUserId: string; // Master admin who created the tenant
  name: string;
  slug: string;
}) => {
  // Modified implementation with master admin checks
};
```

#### TeamMember Model to TenantMember Model

```typescript
// FROM: models/teamMember.ts
export const updateTeamMember = async ({ where, data }) => {
  return await prisma.teamMember.update({
    where,
    data,
  });
};

// TO: models/tenantMember.ts
export const updateTenantMember = async ({ where, data, requestingUserId }) => {
  // Verify requestingUserId has master admin rights
  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
  });
  
  if (!requestingUser.isMasterAdmin) {
    throw new Error('Only master administrators can modify tenant members');
  }
  
  return await prisma.tenantMember.update({
    where,
    data,
  });
};
```

### 2. Authentication and Access Control Updates

#### Update Authentication Guards

```typescript
// FROM: lib/guards/team-api-key.ts
export const guardTeamApiKey = async (req, res, next) => {
  // Current implementation
};

// TO: lib/guards/tenant-api-key.ts
export const guardTenantApiKey = async (req, res, next) => {
  // Updated implementation
};
```

#### Create Master Admin Guards

```typescript
// NEW: lib/guards/master-admin.ts
export const guardMasterAdmin = async (req, res, next) => {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!user.isMasterAdmin) {
    throw new Error('Only master administrators can access this resource');
  }
  
  next();
};
```

### 3. API Endpoints Migration

#### Update Route Paths

- Rename all `/api/teams/...` routes to `/api/tenants/...`
- Create new `/api/admin/tenants/...` routes for master admin operations

#### Example API Route Changes

```typescript
// FROM: pages/api/teams/[slug]/index.ts
export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    // Team operations
  } catch (error) {
    // Error handling
  }
}

// TO: pages/api/tenants/[slug]/index.ts
export default async function handler(req, res) {
  try {
    const session = await getSession(req, res);
    // Tenant operations with updated permissions
  } catch (error) {
    // Error handling
  }
}

// NEW: pages/api/admin/tenants/index.ts
export default async function handler(req, res) {
  try {
    // Apply master admin guard
    await guardMasterAdmin(req, res);
    
    // Master admin operations for tenants
    switch (req.method) {
      case 'GET':
        // List all tenants
        break;
      case 'POST':
        // Create a new tenant
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    // Error handling
  }
}
```

### 4. Helper Functions Migration

#### Access Control Helpers

```typescript
// FROM: models/team.ts
export const throwIfNoTeamAccess = async (req, res) => {
  // Implementation
};

// TO: models/tenant.ts
export const throwIfNoTenantAccess = async (req, res) => {
  // Updated implementation with tenant checks
};

// NEW: models/tenant.ts
export const throwIfNotMasterAdmin = async (req, res) => {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  if (!user.isMasterAdmin) {
    throw new Error('Only master administrators can perform this action');
  }
  
  return user;
};
```

### 5. Utility Scripts Migration

#### Update delete-team.js

```javascript
// FROM: delete-team.js
async function handleTeamDeletion(teamId) {
  // Implementation
}

// TO: delete-tenant.js
async function handleTenantDeletion(tenantId) {
  // Check if user is master admin
  // Updated implementation
}
```

## Frontend Migration Strategy

### 1. API Client Updates

```typescript
// FROM: lib/teams/api.ts
export const createTeam = async (data) => {
  return await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

// TO: lib/tenants/api.ts
export const createTenant = async (data) => {
  return await fetch('/api/admin/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};
```

### 2. UI Component Updates

```typescript
// FROM: components/teams/TeamList.tsx
export const TeamList = () => {
  // Implementation
};

// TO: components/tenants/TenantList.tsx
export const TenantList = () => {
  // Updated implementation
};

// NEW: components/admin/tenants/TenantManagement.tsx
export const TenantManagement = () => {
  // Master admin tenant management implementation
};
```

### 3. Page Component Updates

```typescript
// FROM: pages/teams/[slug]/settings.tsx
export default function TeamSettings() {
  // Implementation
}

// TO: pages/tenants/[slug]/settings.tsx
export default function TenantSettings() {
  // Updated implementation with tenant terminology
}

// NEW: pages/admin/tenants/index.tsx
export default function AdminTenants() {
  // Master admin tenant management page
}
```

## Implementation Phases

### Phase 1: Preparation and Analysis
- Identify all Team references in the codebase
- Create detailed migration plan for each file
- Set up testing environments

### Phase 2: Core Model Migration
- Create new Tenant and TenantMember models
- Implement master admin role and permissions
- Create data migration scripts

### Phase 3: API Layer Migration
- Create new tenant API endpoints
- Update authentication guards
- Implement master admin API routes
- Test API functionality

### Phase 4: Frontend Migration
- Update UI components with tenant terminology
- Create master admin dashboard
- Implement tenant management UI
- Test UI functionality

### Phase 5: Testing and Validation
- Comprehensive testing of all migrated functionality
- Performance testing
- Security testing

### Phase 6: Deployment
- Deploy database schema changes
- Execute data migration
- Deploy code changes
- Monitor for issues

## Testing Strategies

### API Testing
- Unit tests for all new tenant-related functions
- Integration tests for API endpoints
- Authorization tests for master admin functionality

### Frontend Testing
- Component tests for new UI elements
- E2E tests for tenant management workflows
- Accessibility tests for new interfaces

### Security Testing
- Role-based access control tests
- API security tests
- Authentication flow tests

## Rollback Plan

### Quick Rollback
- Maintain compatibility layer during initial deployment
- Keep old team tables until migration is confirmed successful
- Implement feature flags to quickly disable tenant functionality

### Full Rollback
- Maintain database backups
- Create reverse migration scripts
- Document rollback procedures

## Monitoring and Maintenance

### Post-Migration Monitoring
- Add specific logging for tenant operations
- Monitor performance metrics
- Track error rates for tenant-related functionality

### Long-term Maintenance
- Document the new tenant architecture
- Update developer guidelines
- Create tenant management documentation for master administrators