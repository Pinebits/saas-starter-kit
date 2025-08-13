import { NextApiRequest, NextApiResponse } from 'next';
import { ApiError } from '@/lib/errors';
import { getCurrentUser } from 'models/user';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validate query parameters
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only master admins can access this endpoint
  const user = await getCurrentUser(req, res);
  if (!user || !user.isMasterAdmin) {
    res.setHeader('Allow', ['GET']);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    throw new ApiError(405, `Method ${req.method} Not Allowed`);
  }

  // Parse and validate query parameters
  const { page, limit, action, userId, targetType, targetId, from, to } = querySchema.parse(req.query);
  
  // Build the query
  const where = {
    ...(action && { action }),
    ...(userId && { userId }),
    ...(targetType && { targetType }),
    ...(targetId && { targetId }),
    ...(from || to ? {
      createdAt: {
        ...(from && { gte: from }),
        ...(to && { lte: to }),
      }
    } : {}),
  };

  // Get total count for pagination
  const total = await prisma.adminAuditLog.count({ where });
  
  // Get the audit logs
  const logs = await prisma.adminAuditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return res.status(200).json({ 
    data: logs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  });
}