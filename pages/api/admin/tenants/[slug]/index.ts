import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getTenant } from 'models/tenant';
import { getTenantMembers } from 'models/tenant';
import { ApiError } from '@/lib/errors';
import { authOptions } from '@/lib/nextAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET': {
        await handleGET(req, res);
        break;
      }
      default: {
        res.setHeader('Allow', 'GET');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
      }
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get tenant details for admin
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Check if user is master admin
  if (!session.user?.isMasterAdmin) {
    throw new ApiError(403, 'Only master administrators can access this endpoint');
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    throw new ApiError(400, 'Tenant slug is required');
  }

  try {
    // Get tenant details
    const tenant = await getTenant({ slug });
    
    // Get tenant members (with master admin access)
    const members = await getTenantMembers(slug, session.user.id);

    // Return tenant with members
    res.status(200).json({
      data: {
        ...tenant,
        members
      }
    });
  } catch (error) {
    console.error('Error in admin tenant API:', error);
    if (error.message === 'Tenant not found') {
      throw new ApiError(404, 'Tenant not found');
    }
    throw error;
  }
};
