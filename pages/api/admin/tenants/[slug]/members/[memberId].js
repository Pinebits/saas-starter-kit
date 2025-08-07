import { throwIfNotMasterAdmin } from '@/lib/guards/master-admin';
import { getTenant } from '@/models/tenant';
import { removeTenantMember } from '@/models/tenant';
import { tenantSlugSchema } from '@/lib/zod/schema';
import { validateWithSchema } from '@/lib/zod';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    // Check if user is a master admin for all operations on this endpoint
    const masterAdmin = await throwIfNotMasterAdmin(req, res);
    
    // Get slug from query params
    const { slug } = validateWithSchema(tenantSlugSchema, req.query);
    
    // Get member ID from route
    const { memberId } = req.query;
    
    if (!memberId) {
      return res.status(400).json({ error: 'memberId is required' });
    }
    
    // Get tenant by slug
    const tenant = await getTenant({ slug });
    
    // Get the member to verify it exists and get the user ID
    const member = await prisma.tenantMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Tenant member not found' });
    }
    
    // Verify the member belongs to the specified tenant
    if (member.tenantId !== tenant.id) {
      return res.status(400).json({ error: 'Member does not belong to this tenant' });
    }
    
    switch (req.method) {
      case 'DELETE':
        // Remove a user from a tenant (master admin only)
        await removeTenantMember(
          tenant.id,
          member.userId,
          masterAdmin.id
        );
        
        return res.status(200).json({ success: true });
        
      case 'PATCH':
        // Update a tenant member's role (master admin only)
        const { role } = req.body;
        
        if (!role) {
          return res.status(400).json({ error: 'role is required' });
        }
        
        // Create audit log first
        await prisma.adminAuditLog.create({
          data: {
            userId: masterAdmin.id,
            action: 'UPDATE_TENANT_MEMBER_ROLE',
            targetType: 'TENANT_MEMBER',
            targetId: member.id,
            details: { 
              tenantId: tenant.id, 
              userId: member.userId,
              userEmail: member.user.email,
              previousRole: member.role,
              newRole: role
            }
          }
        });
        
        // Update the member's role
        const updatedMember = await prisma.tenantMember.update({
          where: { id: memberId },
          data: { role }
        });
        
        return res.status(200).json(updatedMember);
        
      default:
        res.setHeader('Allow', ['DELETE', 'PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}