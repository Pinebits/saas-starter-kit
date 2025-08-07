import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { prisma } from '@/lib/prisma';
import { updateUser } from '@/models/user';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    // Get userId from route
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    // Get user by ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isMasterAdmin: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    switch (req.method) {
      case 'GET':
        // Get master administrator details
        return res.status(200).json(user);
        
      case 'DELETE':
        // Revoke master administrator status
        if (!user.isMasterAdmin) {
          return res.status(400).json({ error: 'User is not a master administrator' });
        }
        
        // Count master admins to ensure we're not removing the last one
        const masterAdminCount = await prisma.user.count({
          where: { isMasterAdmin: true }
        });
        
        if (masterAdminCount <= 1) {
          return res.status(400).json({ 
            error: 'Cannot remove the last master administrator. Designate another user as master administrator first.' 
          });
        }
        
        // Update user to remove master admin status
        await updateUser({
          where: { id: user.id },
          data: { isMasterAdmin: false },
          requestingUserId: masterAdmin.id
        });
        
        return res.status(200).json({ success: true });
        
      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}