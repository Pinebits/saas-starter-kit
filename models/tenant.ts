import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { findOrCreateApp } from '@/lib/svix';
import { Role, Tenant } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getCurrentUser } from './user';
import { normalizeUser } from './user';
import { validateWithSchema, tenantSlugSchema } from '@/lib/zod';
import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';

/**
 * Create a new tenant
 * Only master admins can create tenants
 */
export const createTenant = async (param: {
  createdByUserId: string; // Master admin who created the tenant
  name: string;
  slug: string;
}) => {
  const { createdByUserId, name, slug } = param;

  // Check if the user is a master admin
  const user = await prisma.user.findUnique({
    where: { id: createdByUserId },
    select: { isMasterAdmin: true }
  });

  if (!user?.isMasterAdmin) {
    throw new Error('Only master administrators can create tenants');
  }

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
    },
  });

  // Add audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: createdByUserId,
      action: 'CREATE_TENANT',
      targetType: 'TENANT',
      targetId: tenant.id,
      details: { name, slug }
    }
  });

  // Create Svix app for webhooks
  await findOrCreateApp(tenant.name, tenant.id);

  return tenant;
};

/**
 * Get tenant by customer ID
 */
export const getByCustomerId = async (
  billingId: string
): Promise<Tenant | null> => {
  return await prisma.tenant.findFirst({
    where: {
      billingId,
    },
  });
};

/**
 * Get tenant by ID or slug
 */
export const getTenant = async (key: { id: string } | { slug: string }) => {
  return await prisma.tenant.findUniqueOrThrow({
    where: key,
  });
};

/**
 * Delete a tenant
 * Only master admins can delete tenants
 */
export const deleteTenant = async (
  key: { id: string } | { slug: string },
  masterAdminId: string
) => {
  // Check if the user is a master admin
  const user = await prisma.user.findUnique({
    where: { id: masterAdminId },
    select: { isMasterAdmin: true }
  });

  if (!user?.isMasterAdmin) {
    throw new Error('Only master administrators can delete tenants');
  }

  // Get the tenant first for audit logging
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: key,
  });

  // Add audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: masterAdminId,
      action: 'DELETE_TENANT',
      targetType: 'TENANT',
      targetId: tenant.id,
      details: { id: tenant.id, name: tenant.name, slug: tenant.slug }
    }
  });

  return await prisma.tenant.delete({
    where: key,
  });
};

/**
 * Add a user to a tenant
 * Only master admins can add users to tenants
 */
export const addTenantMember = async (
  tenantId: string,
  userId: string,
  role: Role,
  masterAdminId: string
) => {
  // Check if the user making the request is a master admin
  const user = await prisma.user.findUnique({
    where: { id: masterAdminId },
    select: { isMasterAdmin: true }
  });

  if (!user?.isMasterAdmin) {
    throw new Error('Only master administrators can add tenant members');
  }

  const tenantMember = await prisma.tenantMember.upsert({
    create: {
      tenantId,
      userId,
      role,
    },
    update: {
      role,
    },
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  // Add audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: masterAdminId,
      action: 'ADD_TENANT_MEMBER',
      targetType: 'TENANT_MEMBER',
      targetId: tenantMember.id,
      details: { tenantId, userId, role }
    }
  });

  return tenantMember;
};

/**
 * Remove a user from a tenant
 * Only master admins can remove users from tenants
 */
export const removeTenantMember = async (
  tenantId: string,
  userId: string,
  masterAdminId: string
) => {
  // Check if the user making the request is a master admin
  const user = await prisma.user.findUnique({
    where: { id: masterAdminId },
    select: { isMasterAdmin: true }
  });

  if (!user?.isMasterAdmin) {
    throw new Error('Only master administrators can remove tenant members');
  }

  // Get the member first for audit logging
  const member = await prisma.tenantMember.findUniqueOrThrow({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });

  // Add audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: masterAdminId,
      action: 'REMOVE_TENANT_MEMBER',
      targetType: 'TENANT_MEMBER',
      targetId: member.id,
      details: { 
        tenantId, 
        userId, 
        userEmail: member.user.email,
        role: member.role 
      }
    }
  });

  return await prisma.tenantMember.delete({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });
};

/**
 * Get all tenants
 * If userId is provided, only return tenants the user is a member of
 * If no userId is provided, only master admins can get all tenants
 */
export const getTenants = async (param: { 
  userId?: string,
  masterAdminId?: string
}) => {
  const { userId, masterAdminId } = param;

  // If userId is provided, get tenants for that user
  if (userId) {
    return await prisma.tenant.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }
  
  // Otherwise, make sure the request is from a master admin
  if (masterAdminId) {
    const user = await prisma.user.findUnique({
      where: { id: masterAdminId },
      select: { isMasterAdmin: true }
    });

    if (!user?.isMasterAdmin) {
      throw new Error('Only master administrators can get all tenants');
    }

    // Return all tenants for master admins
    return await prisma.tenant.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  throw new Error('Either userId or masterAdminId must be provided');
};

/**
 * Get tenant roles for a user
 */
export async function getTenantRoles(userId: string) {
  return await prisma.tenantMember.findMany({
    where: {
      userId,
    },
    select: {
      tenantId: true,
      role: true,
    },
  });
}

/**
 * Check if a user is an admin or owner of a tenant
 */
export async function isTenantAdmin(userId: string, tenantId: string) {
  const tenantMember = await prisma.tenantMember.findUniqueOrThrow({
    where: {
      tenantId_userId: {
        userId,
        tenantId,
      },
    },
  });

  return tenantMember.role === Role.ADMIN || tenantMember.role === Role.OWNER;
}

/**
 * Get members of a tenant
 */
export const getTenantMembers = async (
  slug: string, 
  masterAdminId?: string
) => {
  // If masterAdminId is provided, check if the user is a master admin
  if (masterAdminId) {
    const user = await prisma.user.findUnique({
      where: { id: masterAdminId },
      select: { isMasterAdmin: true }
    });

    if (!user?.isMasterAdmin) {
      throw new Error('Only master administrators can get all tenant members');
    }
  }

  const members = await prisma.tenantMember.findMany({
    where: {
      tenant: {
        slug,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return members?.map((member) => {
    member.user = normalizeUser(member.user);
    return member;
  });
};

/**
 * Update a tenant
 * Only master admins can update tenants
 */
export const updateTenant = async (
  slug: string,
  data: Partial<Tenant>,
  masterAdminId: string
) => {
  // Check if the user is a master admin
  const user = await prisma.user.findUnique({
    where: { id: masterAdminId },
    select: { isMasterAdmin: true }
  });

  if (!user?.isMasterAdmin) {
    throw new Error('Only master administrators can update tenants');
  }

  // Get the tenant first for audit logging
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { slug },
  });

  // Add audit log entry
  await prisma.adminAuditLog.create({
    data: {
      userId: masterAdminId,
      action: 'UPDATE_TENANT',
      targetType: 'TENANT',
      targetId: tenant.id,
      details: { 
        id: tenant.id, 
        slug, 
        beforeUpdate: {
          name: tenant.name,
          domain: tenant.domain,
          defaultRole: tenant.defaultRole
        },
        afterUpdate: data
      }
    }
  });

  return await prisma.tenant.update({
    where: {
      slug,
    },
    data: data,
  });
};

/**
 * Check if a tenant exists
 */
export const isTenantExists = async (slug: string) => {
  return await prisma.tenant.count({
    where: {
      slug,
    },
  });
};

/**
 * Check if the current user has access to the tenant
 * Should be used in API routes to check if the user has access to the tenant
 */
export const throwIfNoTenantAccess = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Master admins have access to all tenants
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isMasterAdmin: true }
  });

  if (user?.isMasterAdmin) {
    const { slug } = validateWithSchema(tenantSlugSchema, req.query);
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug }
    });
    
    return {
      role: Role.MASTER_ADMIN,
      tenant,
      user: {
        ...session.user,
        isMasterAdmin: true
      }
    };
  }

  // For regular users, check if they have access to the tenant
  const { slug } = validateWithSchema(tenantSlugSchema, req.query);

  const tenantMember = await getTenantMember(session.user.id, slug);

  if (!tenantMember) {
    throw new Error('You do not have access to this tenant');
  }

  return {
    ...tenantMember,
    user: {
      ...session.user,
      isMasterAdmin: false
    },
  };
};

/**
 * Get a tenant member
 */
export const getTenantMember = async (userId: string, slug: string) => {
  return await prisma.tenantMember.findFirstOrThrow({
    where: {
      userId,
      tenant: {
        slug,
      },
      role: {
        in: ['ADMIN', 'MEMBER', 'OWNER'],
      },
    },
    include: {
      tenant: true,
    },
  });
};

/**
 * Get current user with tenant info
 */
export const getCurrentUserWithTenant = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const user = await getCurrentUser(req, res);

  // Check if user is a master admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isMasterAdmin: true }
  });

  if (dbUser?.isMasterAdmin) {
    const { slug } = validateWithSchema(tenantSlugSchema, req.query);
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { slug }
    });
    
    return {
      ...user,
      isMasterAdmin: true,
      role: Role.MASTER_ADMIN,
      tenant
    };
  }

  // For regular users
  const { slug } = validateWithSchema(tenantSlugSchema, req.query);
  const { role, tenant } = await getTenantMember(user.id, slug);

  return {
    ...user,
    isMasterAdmin: false,
    role,
    tenant,
  };
};