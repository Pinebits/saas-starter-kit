import { permissions } from '@/lib/permissions';
import { throwIfNoTenantAccess } from 'models/tenant';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGET(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get permissions for a tenant for the current user
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const tenantAccess = await throwIfNoTenantAccess(req, res);

  // If user is a master admin, provide full master admin permissions
  if (tenantAccess.user.isMasterAdmin) {
    res.json({ data: permissions['MASTER_ADMIN'] });
    return;
  }

  // Otherwise, return permissions based on tenant role
  res.json({ data: permissions[tenantAccess.role] });
};