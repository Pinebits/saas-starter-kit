import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { getTenants, createTenant } from '@/models/tenant';
import { createTenantSchema } from '@/lib/zod/schema';
import { validateWithSchema } from '@/lib/zod';
import { slugify } from '@/lib/server-common';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    switch (req.method) {
      case 'GET':
        // Get all tenants (master admin only)
        const tenants = await getTenants({ masterAdminId: masterAdmin.id });
        return res.status(200).json(tenants);
        
      case 'POST':
        // Create a new tenant (master admin only)
        const data = validateWithSchema(createTenantSchema, req.body);
        
        // Generate slug from name if not provided
        const slug = data.slug || slugify(data.name);
        
        const tenant = await createTenant({
          createdByUserId: masterAdmin.id,
          name: data.name,
          slug
        });
        
        return res.status(201).json(tenant);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}