import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { getTenants } from 'models/tenant';
import { getCurrentUser } from 'models/user';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // Get tenants the user has access to
  const tenants = await getTenants({ userId: user.id });
  return res.status(200).json({ data: tenants });
}