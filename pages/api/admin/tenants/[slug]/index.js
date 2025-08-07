import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { getTenant, updateTenant, deleteTenant } from '@/models/tenant';
import { tenantSlugSchema, updateTenantSchema } from '@/lib/zod/schema';
import { validateWithSchema } from '@/lib/zod';
import { slugify } from '@/lib/server-common';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    // Get slug from query params
    const { slug } = validateWithSchema(tenantSlugSchema, req.query);
    
    switch (req.method) {
      case 'GET':
        // Get a single tenant by slug (master admin only)
        const tenant = await getTenant({ slug });
        return res.status(200).json(tenant);
        
      case 'PATCH':
      case 'PUT':
        // Update a tenant (master admin only)
        const data = validateWithSchema(updateTenantSchema, req.body);
        
        // Generate slug from name if provided
        const updateData = {
          ...data,
          slug: data.slug || (data.name ? slugify(data.name) : undefined)
        };
        
        const updatedTenant = await updateTenant(
          slug,
          updateData,
          masterAdmin.id
        );
        
        return res.status(200).json(updatedTenant);
        
      case 'DELETE':
        // Delete a tenant (master admin only)
        await deleteTenant({ slug }, masterAdmin.id);
        
        return res.status(200).json({ success: true });
        
      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}