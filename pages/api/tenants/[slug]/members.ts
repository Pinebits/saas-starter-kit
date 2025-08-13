import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { 
  addTenantMember,
  getTenantMembers,
  removeTenantMember,
  getTenant
} from 'models/tenant';
import { getCurrentUser, getUser } from 'models/user';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validate request parameters
const updateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const user = await getCurrentUser(req, res);

  if (!slug || typeof slug !== 'string') {
    throw new ApiError(400, 'Invalid tenant slug');
  }

  const tenant = await getTenant({ slug });

  switch (req.method) {
    case 'GET':
      // Get tenant members
      // Master admins can view any tenant's members
      // Regular users can only view members of tenants they belong to
      if (!user.isMasterAdmin) {
        // Check if user is a member of this tenant
        const isMember = await prisma.tenantMember.findUnique({
          where: {
            tenantId_userId: {
              tenantId: tenant.id,
              userId: user.id
            }
          }
        });
        
        if (!isMember) {
          throw new ApiError(403, 'You do not have access to this tenant');
        }
      }

      const members = await getTenantMembers(slug, user.isMasterAdmin ? user.id : undefined);
      return res.status(200).json({ data: members });

    case 'POST':
      // Add a user to the tenant (only master admins can do this)
      if (!user.isMasterAdmin) {
        throw new ApiError(403, 'Only master administrators can add tenant members');
      }

      const { userId, role } = updateMemberSchema.parse(req.body);
      
      // Check if the user exists
      const userToAdd = await getUser({ id: userId });
      if (!userToAdd) {
        throw new ApiError(404, 'User not found');
      }

      const member = await addTenantMember(
        tenant.id,
        userId,
        role,
        user.id
      );

      return res.status(201).json({ data: member });

    case 'DELETE':
      // Remove a user from the tenant (only master admins can do this)
      if (!user.isMasterAdmin) {
        throw new ApiError(403, 'Only master administrators can remove tenant members');
      }

      const { userId: userIdToRemove } = z.object({
        userId: z.string().uuid(),
      }).parse(req.query);

      await removeTenantMember(
        tenant.id,
        userIdToRemove,
        user.id
      );

      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }
}