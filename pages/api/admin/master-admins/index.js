import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { prisma } from '@/lib/prisma';
import { updateUser } from '@/models/user';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    switch (req.method) {
      case 'GET':
        // Get all master administrators
        const masterAdmins = await prisma.user.findMany({
          where: {
            isMasterAdmin: true
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true
          }
        });
        
        return res.status(200).json(masterAdmins);
        
      case 'POST':
        // Add a new master administrator
        const { userId, email } = req.body;
        
        if (!userId && !email) {
          return res.status(400).json({ error: 'Either userId or email is required' });
        }
        
        let user;
        
        if (userId) {
          user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              isMasterAdmin: true
            }
          });
        } else {
          user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              isMasterAdmin: true
            }
          });
        }
        
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.isMasterAdmin) {
          return res.status(400).json({ error: 'User is already a master administrator' });
        }
        
        // Update user to master admin
        const updatedUser = await updateUser({
          where: { id: user.id },
          data: { isMasterAdmin: true },
          requestingUserId: masterAdmin.id
        });
        
        return res.status(200).json({
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          isMasterAdmin: true
        });
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}