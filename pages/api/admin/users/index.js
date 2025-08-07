import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { getAllUsers } from '@/models/user';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    switch (req.method) {
      case 'GET':
        // Get all users (master admin only)
        const users = await getAllUsers(masterAdmin.id);
        return res.status(200).json(users);
        
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}