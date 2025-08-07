import { ApiError } from '@/lib/errors';
import { Action, Resource, permissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { Role, TenantMember } from '@prisma/client';
import type { Session } from 'next-auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { maxLengthPolicies } from '@/lib/common';

export const normalizeUser = (user) => {
  if (user?.name) {
    user.name = user.name.substring(0, maxLengthPolicies.name);
  }

  return user;
};

export const createUser = async (data: {
  name: string;
  email: string;
  password?: string;
  emailVerified?: Date | null;
  isMasterAdmin?: boolean;
}) => {
  return await prisma.user.create({
    data: normalizeUser(data),
  });
};

export const updateUser = async ({ where, data, requestingUserId = null }) => {
  data = normalizeUser(data);
  
  // Special check for isMasterAdmin updates - only master admins can change this
  if (data.isMasterAdmin !== undefined && requestingUserId) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { isMasterAdmin: true }
    });
    
    if (!requestingUser?.isMasterAdmin) {
      throw new ApiError(403, 'Only master administrators can change administrator status');
    }
    
    // If removing master admin status, make sure there's at least one other master admin
    if (data.isMasterAdmin === false) {
      const masterAdminCount = await prisma.user.count({
        where: { isMasterAdmin: true }
      });
      
      if (masterAdminCount <= 1) {
        throw new ApiError(
          400, 
          'Cannot remove the last master administrator. Designate another user as master administrator first.'
        );
      }
    }
    
    // Add audit log entry
    await prisma.adminAuditLog.create({
      data: {
        userId: requestingUserId,
        action: data.isMasterAdmin ? 'GRANT_MASTER_ADMIN' : 'REVOKE_MASTER_ADMIN',
        targetType: 'USER',
        targetId: where.id || where.email,
        details: { 
          granted: data.isMasterAdmin,
          timestamp: new Date().toISOString()
        }
      }
    });
  }

  return await prisma.user.update({
    where,
    data,
  });
};

export const upsertUser = async ({ where, update, create }) => {
  update = normalizeUser(update);
  create = normalizeUser(create);

  return await prisma.user.upsert({
    where,
    update,
    create,
  });
};

export const getUser = async (key: { id: string } | { email: string }) => {
  const user = await prisma.user.findUnique({
    where: key,
  });

  return normalizeUser(user);
};

export const getUserBySession = async (session: Session | null) => {
  if (session === null || session.user === null) {
    return null;
  }

  const id = session?.user?.id;

  if (!id) {
    return null;
  }

  return await getUser({ id });
};

export const deleteUser = async (key: { id: string } | { email: string }, requestingUserId = null) => {
  // Get the user first for audit logging
  const user = await prisma.user.findUnique({
    where: key,
    select: {
      id: true,
      email: true,
      name: true,
      isMasterAdmin: true
    }
  });
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Check if deleting a master admin
  if (user.isMasterAdmin && requestingUserId) {
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { isMasterAdmin: true }
    });
    
    if (!requestingUser?.isMasterAdmin) {
      throw new ApiError(403, 'Only master administrators can delete other master administrators');
    }
    
    // Check if this is the last master admin
    const masterAdminCount = await prisma.user.count({
      where: { isMasterAdmin: true }
    });
    
    if (masterAdminCount <= 1) {
      throw new ApiError(
        400, 
        'Cannot delete the last master administrator. Designate another user as master administrator first.'
      );
    }
    
    // Add audit log entry
    await prisma.adminAuditLog.create({
      data: {
        userId: requestingUserId,
        action: 'DELETE_MASTER_ADMIN',
        targetType: 'USER',
        targetId: user.id,
        details: { 
          email: user.email,
          name: user.name,
          timestamp: new Date().toISOString()
        }
      }
    });
  }
  
  return await prisma.user.delete({
    where: key,
  });
};

export const findFirstUserOrThrow = async ({ where }) => {
  const user = await prisma.user.findFirstOrThrow({
    where,
  });

  return normalizeUser(user);
};

export const getAllUsers = async (requestingUserId: string) => {
  // Check if requesting user is a master admin
  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
    select: { isMasterAdmin: true }
  });
  
  if (!requestingUser?.isMasterAdmin) {
    throw new ApiError(403, 'Only master administrators can view all users');
  }
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      isMasterAdmin: true,
      _count: {
        select: { tenantMembers: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return users.map(normalizeUser);
};

const isAllowed = (role: Role, resource: Resource, action: Action) => {
  // Master admins have access to everything
  if (role === Role.MASTER_ADMIN) {
    return true;
  }
  
  const rolePermissions = permissions[role];

  if (!rolePermissions) {
    return false;
  }

  for (const permission of rolePermissions) {
    if (
      permission.resource === resource &&
      (permission.actions === '*' || permission.actions.includes(action))
    ) {
      return true;
    }
  }

  return false;
};

export const throwIfNotAllowed = (
  user: Pick<TenantMember, 'role'> | { role: Role; isMasterAdmin?: boolean },
  resource: Resource,
  action: Action
) => {
  // If user is a master admin, they have access to everything
  if (user.isMasterAdmin) {
    return true;
  }
  
  if (isAllowed(user.role, resource, action)) {
    return true;
  }

  throw new ApiError(
    403,
    `You are not allowed to perform ${action} on ${resource}`
  );
};

// Get current user from session
export const getCurrentUser = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);

  if (!session) {
    throw new Error('Unauthorized');
  }

  // Enhance user object with full isMasterAdmin status from database
  const enhancedUser = {
    ...session.user,
    isMasterAdmin: session.user.isMasterAdmin || false
  };

  return enhancedUser;
};