import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { prisma } from '@/lib/prisma';
import { withMiddleware } from '@/lib/middleware';
import { z } from 'zod';

const userSchema = z.object({
  userId: z.string().uuid(),
  isMasterAdmin: z.boolean(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only master admins can access this endpoint
  const adminUser = await throwIfNotMasterAdmin(req, res);

  switch (req.method) {
    case 'GET':
      // Get all users with their master admin status
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isMasterAdmin: true,
          createdAt: true,
          _count: {
            select: { tenantMembers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return res.status(200).json({ data: users });

    case 'PATCH':
      // Update a user's master admin status
      const { userId, isMasterAdmin } = userSchema.parse(req.body);
      
      // Cannot update your own master admin status
      if (userId === adminUser.id) {
        throw new ApiError(400, 'You cannot modify your own master admin status');
      }
      
      // If removing master admin status, make sure there's at least one other master admin
      if (isMasterAdmin === false) {
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
      
      // Update the user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isMasterAdmin },
        select: {
          id: true,
          name: true,
          email: true,
          isMasterAdmin: true
        }
      });
      
      // Create audit log entry
      await prisma.adminAuditLog.create({
        data: {
          userId: adminUser.id,
          action: isMasterAdmin ? 'GRANT_MASTER_ADMIN' : 'REVOKE_MASTER_ADMIN',
          targetType: 'USER',
          targetId: userId,
          details: { 
            granted: isMasterAdmin,
            userEmail: updatedUser.email,
            userName: updatedUser.name,
            timestamp: new Date().toISOString()
          }
        }
      });
      
      return res.status(200).json({ data: updatedUser });

    default:
      res.setHeader('Allow', ['GET', 'PATCH']);
      throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }
}

export default withMiddleware(handler);