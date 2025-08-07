import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { getTenant } from '@/models/tenant';
import { getTenantMembers, addTenantMember, removeTenantMember } from '@/models/tenant';
import { tenantSlugSchema } from '@/lib/zod/schema';
import { validateWithSchema } from '@/lib/zod';
import { Role } from '@prisma/client';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    // Get slug from query params
    const { slug } = validateWithSchema(tenantSlugSchema, req.query);
    
    // Get tenant by slug
    const tenant = await getTenant({ slug });
    
    switch (req.method) {
      case 'GET':
        // Get all members of a tenant (master admin only)
        const members = await getTenantMembers(slug, masterAdmin.id);
        return res.status(200).json(members);
        
      case 'POST':
        // Add a user to a tenant (master admin only)
        const { userId, role = Role.MEMBER } = req.body;
        
        if (!userId) {
          return res.status(400).json({ error: 'userId is required' });
        }
        
        const tenantMember = await addTenantMember(
          tenant.id,
          userId,
          role,
          masterAdmin.id
        );
        
        return res.status(201).json(tenantMember);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}