import { prisma } from '@/lib/prisma';

/**
 * Count tenant members based on provided filter criteria
 */
export const countTenantMembers = async ({ where }) => {
  return await prisma.tenantMember.count({
    where,
  });
};

/**
 * Update a tenant member
 * This function is only called from other functions that handle the master admin check
 */
export const updateTenantMember = async ({ where, data }) => {
  return await prisma.tenantMember.update({
    where,
    data,
  });
};

/**
 * Get all master administrators in the system
 */
export const getMasterAdmins = async () => {
  return await prisma.user.findMany({
    where: {
      isMasterAdmin: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true
    }
  });
};