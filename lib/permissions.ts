import { Role } from '@prisma/client';

type RoleType = (typeof Role)[keyof typeof Role];
export type Action = 'create' | 'update' | 'read' | 'delete' | 'leave';
export type Resource =
  | 'tenant'
  | 'tenant_member'
  | 'tenant_invitation'
  | 'tenant_sso'
  | 'tenant_dsync'
  | 'tenant_audit_log'
  | 'tenant_webhook'
  | 'tenant_payments'
  | 'tenant_api_key'
  | 'admin_users'
  | 'admin_tenants'
  | 'admin_audit_logs'
  | 'team'
  | 'team_member'
  | 'team_invitation'
  | 'team_sso'
  | 'team_dsync'
  | 'team_audit_log'
  | 'team_webhook'
  | 'team_payments'
  | 'team_api_key';

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.MEMBER,
    name: 'Member',
  },
  {
    id: Role.ADMIN,
    name: 'Admin',
  },
  {
    id: Role.OWNER,
    name: 'Owner',
  },
  {
    id: Role.MASTER_ADMIN,
    name: 'Master Admin',
  },
];

export const permissions: RolePermissions = {
  MASTER_ADMIN: [
    // Full admin powers
    {
      resource: 'admin_users',
      actions: '*',
    },
    {
      resource: 'admin_tenants',
      actions: '*',
    },
    {
      resource: 'admin_audit_logs',
      actions: '*',
    },
    // Full tenant powers
    {
      resource: 'tenant',
      actions: '*',
    },
    {
      resource: 'tenant_member',
      actions: '*',
    },
    {
      resource: 'tenant_invitation',
      actions: '*',
    },
    {
      resource: 'tenant_sso',
      actions: '*',
    },
    {
      resource: 'tenant_dsync',
      actions: '*',
    },
    {
      resource: 'tenant_audit_log',
      actions: '*',
    },
    {
      resource: 'tenant_payments',
      actions: '*',
    },
    {
      resource: 'tenant_webhook',
      actions: '*',
    },
    {
      resource: 'tenant_api_key',
      actions: '*',
    },
    // Also team powers for backwards compatibility
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_payments',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
  ],
  OWNER: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_payments',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    // Tenant resources
    {
      resource: 'tenant',
      actions: '*',
    },
    {
      resource: 'tenant_member',
      actions: '*',
    },
    {
      resource: 'tenant_invitation',
      actions: '*',
    },
    {
      resource: 'tenant_sso',
      actions: '*',
    },
    {
      resource: 'tenant_dsync',
      actions: '*',
    },
    {
      resource: 'tenant_audit_log',
      actions: '*',
    },
    {
      resource: 'tenant_payments',
      actions: '*',
    },
    {
      resource: 'tenant_webhook',
      actions: '*',
    },
    {
      resource: 'tenant_api_key',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    // Tenant resources
    {
      resource: 'tenant',
      actions: '*',
    },
    {
      resource: 'tenant_member',
      actions: '*',
    },
    {
      resource: 'tenant_invitation',
      actions: '*',
    },
    {
      resource: 'tenant_sso',
      actions: '*',
    },
    {
      resource: 'tenant_dsync',
      actions: '*',
    },
    {
      resource: 'tenant_audit_log',
      actions: '*',
    },
    {
      resource: 'tenant_webhook',
      actions: '*',
    },
    {
      resource: 'tenant_api_key',
      actions: '*',
    },
  ],
  MEMBER: [
    {
      resource: 'team',
      actions: ['read', 'leave'],
    },
    // Tenant resources
    {
      resource: 'tenant',
      actions: ['read', 'leave'],
    },
  ],
};