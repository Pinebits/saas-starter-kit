import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Guard middleware to ensure only master administrators can access protected resources
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @param next - Function to call if access is granted
 */
export const guardMasterAdmin = async (
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) => {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isMasterAdmin: true }
  });
  
  if (!user || !user.isMasterAdmin) {
    throw new Error('Only master administrators can access this resource');
  }
  
  next();
};

/**
 * Helper function to throw an error if the current user is not a master administrator
 * Can be used directly in API routes
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns The user object if they are a master administrator
 */
export const throwIfNotMasterAdmin = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await getSession(req, res);
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      id: true,
      name: true,
      email: true,
      image: true,
      isMasterAdmin: true 
    }
  });
  
  if (!user || !user.isMasterAdmin) {
    throw new Error('Only master administrators can perform this action');
  }
  
  return user;
};