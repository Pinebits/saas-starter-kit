import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { createTenant, getTenants } from 'models/tenant';
import { getCurrentUser } from 'models/user';
import { z } from 'zod';
import { withMiddleware } from '@/lib/middleware';
import { tenantCreateSchema } from '@/lib/zod';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req, res);

  switch (req.method) {
    case 'GET':
      // Get tenants the user has access to
      // Master admins can see all tenants
      const tenants = await getTenants({ 
        userId: user.isMasterAdmin ? undefined : user.id,
        masterAdminId: user.isMasterAdmin ? user.id : undefined
      });
      return res.status(200).json({ data: tenants });

    case 'POST':
      // Create a new tenant (only master admins can do this)
      if (!user.isMasterAdmin) {
        throw new ApiError(403, 'Only master administrators can create tenants');
      }

      // Validate the request body
      const validatedData = tenantCreateSchema.parse(req.body);
      
      const tenant = await createTenant({
        createdByUserId: user.id,
        name: validatedData.name,
        slug: validatedData.slug,
      });

      return res.status(201).json({ data: tenant });

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }
}

export default withMiddleware(handler);