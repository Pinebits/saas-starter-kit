import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { deleteTenant, getTenant, updateTenant } from 'models/tenant';
import { getCurrentUser } from 'models/user';
import { withMiddleware } from '@/lib/middleware';
import { tenantUpdateSchema } from '@/lib/zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const user = await getCurrentUser(req, res);

  if (!slug || typeof slug !== 'string') {
    throw new ApiError(400, 'Invalid tenant slug');
  }

  switch (req.method) {
    case 'GET':
      // Get tenant details - master admins can view any tenant
      // Regular users can only view tenants they are a member of
      const tenant = await getTenant({ slug });
      
      // If not master admin, check if user is a member of this tenant
      if (!user.isMasterAdmin) {
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
      
      return res.status(200).json({ data: tenant });

    case 'PATCH':
      // Update tenant details (only master admins can do this)
      if (!user.isMasterAdmin) {
        throw new ApiError(403, 'Only master administrators can update tenants');
      }

      // Validate the request body
      const validatedData = tenantUpdateSchema.parse(req.body);

      const updatedTenant = await updateTenant(
        slug,
        validatedData,
        user.id
      );

      return res.status(200).json({ data: updatedTenant });

    case 'DELETE':
      // Delete a tenant (only master admins can do this)
      if (!user.isMasterAdmin) {
        throw new ApiError(403, 'Only master administrators can delete tenants');
      }

      await deleteTenant({ slug }, user.id);
      return res.status(204).end();

    default:
      res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
      throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }
}

export default withMiddleware(handler);