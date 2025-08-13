import { slugify } from '@/lib/server-common';
import { ApiError } from '@/lib/errors';
import { createTenant, getTenants } from 'models/tenant';
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordMetric } from '@/lib/metrics';
import { createTeamSchema, validateWithSchema } from '@/lib/zod';
import { getCurrentUser } from 'models/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGET(req, res);
        break;
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'GET, POST');
        res.status(405).json({
          error: { message: `Method ${method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

// Get teams (now tenants)
const handleGET = async (req: NextApiRequest, res: NextApiResponse) => {
  const user = await getCurrentUser(req, res);
  const tenants = await getTenants({ userId: user.id });

  recordMetric('team.fetched');

  res.status(200).json({ data: tenants });
};

// Create a team (now tenant)
const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const { name } = validateWithSchema(createTeamSchema, req.body);

  const user = await getCurrentUser(req, res);
  const slug = slugify(name);

  // Check if tenant already exists
  const existingTenants = await getTenants({ userId: user.id });
  if (existingTenants.some(tenant => tenant.slug === slug)) {
    throw new ApiError(400, 'A team with the slug already exists.');
  }

  // Note: Only master admins can create tenants via API
  // Regular users should use the tenant creation flow
  const tenant = await createTenant({
    createdByUserId: user.id,
    name,
    slug,
  });

  recordMetric('team.created');

  res.status(200).json({ data: tenant });
};
