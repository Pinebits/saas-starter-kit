# Multi-Tenant Architecture

This SaaS Starter Kit has been enhanced with a comprehensive multi-tenant architecture, providing a robust foundation for building SaaS applications that serve multiple isolated customer environments (tenants).

## Overview

The multi-tenant system replaces the previous Teams concept with a more structured Tenants model. This model is designed to provide:

1. **Proper isolation** between customer environments
2. **Centralized administration** through master administrators
3. **Comprehensive audit logging** of administrative actions
4. **Granular access control** through role-based permissions

## Key Components

### Tenant Model

Each tenant represents an isolated customer environment with its own:

- Members (users who belong to the tenant)
- Settings and configurations
- Resources (API keys, invitations, etc.)

### Master Administrators

Master administrators are super users who can:

- Create, update, and delete tenants
- Add and remove users from tenants
- Assign roles to users within tenants
- View and manage all tenants in the system
- Access system-wide settings and configurations

### Audit Logging

All administrative actions are logged with detailed information:

- Who performed the action
- What action was performed
- When the action was performed
- What resources were affected
- Additional context about the action

### Role-Based Access Control

The system includes a hierarchical role structure:

- **MASTER_ADMIN**: Global administrators with full system access
- **OWNER**: Tenant owners with full access to their tenant
- **ADMIN**: Tenant administrators with elevated permissions
- **MEMBER**: Regular tenant members with basic permissions

## Architecture Decisions

### User-Tenant Relationship

Users can belong to multiple tenants with different roles in each. A user's access to a tenant is controlled by the `TenantMember` relationship.

### Tenant Isolation

Tenant data is isolated through database relationships. All tenant-specific data includes a reference to the tenant ID, ensuring data is not accessible across tenants.

### Administrative Control

Only master administrators can:
- Create or delete tenants
- Add or remove users from tenants
- Designate other users as master administrators

### Migration from Teams

The system includes migration utilities to convert existing Teams data to the new Tenant model while preserving all relationships and historical data.

## Getting Started

### Migrating from Teams to Tenants

If you're upgrading from the previous Teams model, run the migration script:

```
./migrate-to-tenants.bat
```

This script will:
1. Apply the Prisma schema changes
2. Migrate existing teams to tenants
3. Designate an initial master administrator

### Designating Master Administrators

To designate a user as a master administrator, use the provided script:

```
node scripts/designate-master-admin.js designate user@example.com
```

To revoke master administrator privileges:

```
node scripts/designate-master-admin.js revoke user@example.com
```

### Accessing the Admin Dashboard

Master administrators can access the admin dashboard at:

```
/admin
```

From this dashboard, they can manage tenants, users, and system-wide settings.

## API Reference

### Master Admin APIs

- `GET /api/admin/tenants` - List all tenants
- `POST /api/admin/tenants` - Create a new tenant
- `GET /api/admin/tenants/:slug` - Get tenant details
- `PATCH /api/admin/tenants/:slug` - Update a tenant
- `DELETE /api/admin/tenants/:slug` - Delete a tenant
- `GET /api/admin/tenants/:slug/members` - List tenant members
- `POST /api/admin/tenants/:slug/members` - Add a user to a tenant
- `DELETE /api/admin/tenants/:slug/members/:memberId` - Remove a user from a tenant
- `PATCH /api/admin/tenants/:slug/members/:memberId` - Update a user's role in a tenant

### User APIs

- `GET /api/tenants` - List tenants the current user belongs to
- `GET /api/tenants/:slug` - Get tenant details (if user has access)

## Security Considerations

- Master administrator actions are protected with strict authentication checks
- All sensitive operations are logged for audit purposes
- The system prevents removing the last master administrator
- API endpoints include proper validation and authorization checks

## Future Enhancements

- Tenant-specific configurations and settings
- Tenant resource usage tracking and quotas
- Tenant-level audit logs accessible to tenant administrators
- Advanced tenant lifecycle management (suspension, archiving, etc.)