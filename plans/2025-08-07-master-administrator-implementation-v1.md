# Master Administrator Implementation Plan

## Objective
Implement a master administrator role that has global access to manage all tenants and their members. This role should be the only one authorized to add or remove users from tenants.

## Master Administrator Capabilities

The master administrator should be able to:
1. Create, update, and delete tenants
2. Add and remove users from tenants
3. Set user roles within tenants
4. View all tenants and their members
5. View system-wide analytics and usage metrics
6. Manage global settings and configurations

## Implementation Plan

### 1. Database Schema Updates

```prisma
// Add isMasterAdmin field to User model
model User {
  id                     String         @id @default(uuid())
  name                   String
  email                  String         @unique
  emailVerified          DateTime?
  password               String?
  image                  String?
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @default(now())
  invalid_login_attempts Int            @default(0)
  lockedAt               DateTime?
  isMasterAdmin          Boolean        @default(false) // New field
  
  // Relations remain the same but renamed
}

// Optional: Create a separate model for audit logging of master admin actions
model AdminAuditLog {
  id           String   @id @default(uuid())
  userId       String
  action       String
  targetType   String
  targetId     String
  details      Json?
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
}
```

### 2. Authentication and Authorization

#### Create Master Admin Guard

```typescript
// lib/guards/master-admin.ts
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

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
```

#### Update NextAuth Configuration

```typescript
// pages/api/auth/[...nextauth].ts
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth from 'next-auth';
import { prisma } from '@/lib/prisma';

export default NextAuth({
  // Other config
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Add isMasterAdmin to session
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isMasterAdmin: true }
        });
        
        session.user.isMasterAdmin = dbUser?.isMasterAdmin || false;
      }
      return session;
    },
    // Other callbacks
  },
  // Other config
});
```

### 3. API Endpoints for Master Admin

#### Tenant Management Endpoints

```typescript
// pages/api/admin/tenants/index.ts
import { guardMasterAdmin } from '@/lib/guards/master-admin';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { createTenant } from '@/models/tenant';

export default async function handler(req, res) {
  try {
    // Check if user is master admin
    const session = await getSession(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isMasterAdmin: true }
    });
    
    if (!user || !user.isMasterAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Handle admin operations
    switch (req.method) {
      case 'GET':
        // List all tenants
        const tenants = await prisma.tenant.findMany({
          include: {
            _count: {
              select: { members: true },
            },
          },
        });
        
        return res.status(200).json(tenants);
        
      case 'POST':
        // Create a new tenant
        const { name, slug } = req.body;
        
        const tenant = await createTenant({
          createdByUserId: session.user.id,
          name,
          slug,
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
```

#### Tenant Member Management Endpoints

```typescript
// pages/api/admin/tenants/[slug]/members.ts
import { guardMasterAdmin } from '@/lib/guards/master-admin';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export default async function handler(req, res) {
  try {
    // Check if user is master admin
    const session = await getSession(req, res);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isMasterAdmin: true }
    });
    
    if (!user || !user.isMasterAdmin) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const { slug } = req.query;
    
    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug as string },
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    switch (req.method) {
      case 'GET':
        // List tenant members
        const members = await prisma.tenantMember.findMany({
          where: { tenantId: tenant.id },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
        
        return res.status(200).json(members);
        
      case 'POST':
        // Add a user to the tenant
        const { userId, role } = req.body;
        
        // Check if user exists
        const userToAdd = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!userToAdd) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Add user to tenant
        const tenantMember = await prisma.tenantMember.create({
          data: {
            tenantId: tenant.id,
            userId,
            role,
          },
        });
        
        // Log the action
        await prisma.adminAuditLog.create({
          data: {
            userId: session.user.id,
            action: 'ADD_TENANT_MEMBER',
            targetType: 'TENANT_MEMBER',
            targetId: tenantMember.id,
            details: { tenantId: tenant.id, userId, role },
          },
        });
        
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
```

### 4. Frontend Implementation

#### Master Admin Context

```typescript
// contexts/MasterAdminContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

type MasterAdminContextType = {
  isMasterAdmin: boolean;
};

const MasterAdminContext = createContext<MasterAdminContextType>({
  isMasterAdmin: false,
});

export const MasterAdminProvider: React.FC = ({ children }) => {
  const { data: session } = useSession();
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  
  useEffect(() => {
    if (session?.user?.isMasterAdmin) {
      setIsMasterAdmin(true);
    } else {
      setIsMasterAdmin(false);
    }
  }, [session]);
  
  return (
    <MasterAdminContext.Provider value={{ isMasterAdmin }}>
      {children}
    </MasterAdminContext.Provider>
  );
};

export const useMasterAdmin = () => useContext(MasterAdminContext);
```

#### Master Admin Dashboard

```typescript
// pages/admin/index.tsx
import { useMasterAdmin } from '@/contexts/MasterAdminContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AdminDashboard() {
  const { isMasterAdmin } = useMasterAdmin();
  const router = useRouter();
  
  useEffect(() => {
    if (!isMasterAdmin) {
      router.push('/');
    }
  }, [isMasterAdmin, router]);
  
  if (!isMasterAdmin) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Master Admin Dashboard</h1>
      <div>
        <h2>Quick Links</h2>
        <ul>
          <li>
            <a href="/admin/tenants">Manage Tenants</a>
          </li>
          <li>
            <a href="/admin/users">Manage Users</a>
          </li>
          <li>
            <a href="/admin/settings">System Settings</a>
          </li>
        </ul>
      </div>
      {/* Dashboard metrics and widgets */}
    </div>
  );
}
```

#### Tenant Management UI

```typescript
// pages/admin/tenants/index.tsx
import { useState, useEffect } from 'react';
import { useMasterAdmin } from '@/contexts/MasterAdminContext';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function ManageTenants() {
  const { isMasterAdmin } = useMasterAdmin();
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isMasterAdmin) {
      router.push('/');
      return;
    }
    
    // Fetch tenants
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/admin/tenants');
        const data = await response.json();
        setTenants(data);
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [isMasterAdmin, router]);
  
  if (!isMasterAdmin) {
    return <div>Loading...</div>;
  }
  
  if (loading) {
    return <div>Loading tenants...</div>;
  }
  
  return (
    <div>
      <h1>Manage Tenants</h1>
      
      <div className="mb-4">
        <Link href="/admin/tenants/new">
          <button className="btn btn-primary">Create New Tenant</button>
        </Link>
      </div>
      
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Members</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td>{tenant.name}</td>
              <td>{tenant.slug}</td>
              <td>{tenant._count.members}</td>
              <td>{new Date(tenant.createdAt).toLocaleDateString()}</td>
              <td>
                <Link href={`/admin/tenants/${tenant.slug}`}>
                  <button className="btn btn-sm">Manage</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 5. Tenant Member Management UI

```typescript
// pages/admin/tenants/[slug]/members.tsx
import { useState, useEffect } from 'react';
import { useMasterAdmin } from '@/contexts/MasterAdminContext';
import { useRouter } from 'next/router';

export default function ManageTenantMembers() {
  const { isMasterAdmin } = useMasterAdmin();
  const router = useRouter();
  const { slug } = router.query;
  
  const [members, setMembers] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isMasterAdmin || !slug) {
      return;
    }
    
    // Fetch tenant details
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${slug}`);
        const data = await response.json();
        setTenant(data);
      } catch (error) {
        console.error('Error fetching tenant:', error);
      }
    };
    
    // Fetch tenant members
    const fetchMembers = async () => {
      try {
        const response = await fetch(`/api/admin/tenants/${slug}/members`);
        const data = await response.json();
        setMembers(data);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenant();
    fetchMembers();
  }, [isMasterAdmin, slug]);
  
  if (!isMasterAdmin) {
    return <div>Unauthorized</div>;
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>{tenant?.name}: Manage Members</h1>
      
      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => router.push(`/admin/tenants/${slug}/members/add`)}
        >
          Add Member
        </button>
      </div>
      
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.user.name}</td>
              <td>{member.user.email}</td>
              <td>{member.role}</td>
              <td>{new Date(member.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  Remove
                </button>
                <button
                  className="btn btn-sm ml-2"
                  onClick={() => handleEditRole(member)}
                >
                  Edit Role
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  async function handleRemoveMember(memberId) {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        await fetch(`/api/admin/tenants/${slug}/members/${memberId}`, {
          method: 'DELETE',
        });
        
        // Refresh the list
        setMembers(members.filter((m) => m.id !== memberId));
      } catch (error) {
        console.error('Error removing member:', error);
      }
    }
  }
  
  function handleEditRole(member) {
    // Implementation for editing role
  }
}
```

### 6. Designating Master Administrators

#### Command-line Script

```javascript
// scripts/designate-master-admin.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function designateMasterAdmin(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isMasterAdmin: true },
    });

    console.log(`User ${user.name} (${user.email}) has been designated as a Master Administrator.`);
  } catch (error) {
    console.error('Error designating master admin:', error);
  }
}

async function init() {
  if (process.argv.length < 3) {
    console.log(`
      Usage: 
        node designate-master-admin.js <email>
        
      Example: 
        node designate-master-admin.js admin@example.com
    `);
    process.exit(1);
  }

  const email = process.argv[2];
  
  try {
    await designateMasterAdmin(email);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

init();
```

#### Admin UI for Managing Master Admins

```typescript
// pages/admin/master-admins.tsx
import { useState, useEffect } from 'react';
import { useMasterAdmin } from '@/contexts/MasterAdminContext';
import { useRouter } from 'next/router';

export default function ManageMasterAdmins() {
  const { isMasterAdmin } = useMasterAdmin();
  const router = useRouter();
  
  const [masterAdmins, setMasterAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isMasterAdmin) {
      router.push('/');
      return;
    }
    
    // Fetch master admins
    const fetchMasterAdmins = async () => {
      try {
        const response = await fetch('/api/admin/master-admins');
        const data = await response.json();
        setMasterAdmins(data);
      } catch (error) {
        console.error('Error fetching master admins:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMasterAdmins();
  }, [isMasterAdmin, router]);
  
  if (!isMasterAdmin) {
    return <div>Unauthorized</div>;
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      <h1>Manage Master Administrators</h1>
      
      <div className="mb-4">
        <button
          className="btn btn-primary"
          onClick={() => router.push('/admin/master-admins/add')}
        >
          Add Master Admin
        </button>
      </div>
      
      <table className="table w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {masterAdmins.map((admin) => (
            <tr key={admin.id}>
              <td>{admin.name}</td>
              <td>{admin.email}</td>
              <td>
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => handleRevokeMasterAdmin(admin.id)}
                >
                  Revoke Admin Rights
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  
  async function handleRevokeMasterAdmin(userId) {
    if (confirm('Are you sure you want to revoke master admin rights?')) {
      try {
        await fetch(`/api/admin/master-admins/${userId}`, {
          method: 'DELETE',
        });
        
        // Refresh the list
        setMasterAdmins(masterAdmins.filter((a) => a.id !== userId));
      } catch (error) {
        console.error('Error revoking master admin:', error);
      }
    }
  }
}
```

## Security Considerations

1. **Secure Access to Master Admin Functions**
   - Implement strict authentication checks
   - Consider requiring re-authentication for critical operations
   - Add rate limiting for admin API endpoints

2. **Audit Logging**
   - Log all actions performed by master administrators
   - Include details like IP address, timestamp, and affected resources
   - Create a UI for reviewing audit logs

3. **Separation of Concerns**
   - Ensure master admin functions are isolated from regular user functions
   - Implement proper authorization checks at all levels (API, UI, database)

4. **Limiting Master Admin Privileges**
   - Consider implementing different levels of master admin permissions
   - Create a "read-only" admin role for monitoring without modification rights

## Testing Strategy

1. **Unit Testing**
   - Test all master admin functions and guards
   - Test authorization logic

2. **Integration Testing**
   - Test API endpoints with various permission scenarios
   - Test database operations

3. **End-to-End Testing**
   - Test complete workflows from UI to database
   - Test edge cases and error handling

4. **Security Testing**
   - Perform penetration testing on admin endpoints
   - Test for privilege escalation vulnerabilities

## Deployment and Rollout

1. **Phased Rollout**
   - Start with a limited set of master admins
   - Gradually expand the feature set

2. **Documentation**
   - Create comprehensive documentation for master admins
   - Document security procedures and best practices

3. **Training**
   - Provide training for initial master administrators
   - Create onboarding materials for future master admins

## Monitoring and Maintenance

1. **Performance Monitoring**
   - Monitor admin API endpoint performance
   - Track master admin action volumes

2. **Security Monitoring**
   - Monitor for suspicious admin activities
   - Set up alerts for unusual patterns

3. **Regular Reviews**
   - Periodically review master admin privileges
   - Audit master admin actions regularly