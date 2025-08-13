# 🚀 Test Users Quick Reference

## 🔐 Master Administrators (Global Access)

| Email | Password | Access URL |
|-------|----------|------------|
| `admin@saas-starter.com` | `admin123!` | `/admin` |
| `platform@saas-starter.com` | `platform123!` | `/admin` |

**Capabilities**: Full system access, manage all tenants, view audit logs, system configuration

---

## 🏢 StartupCorp (Tech Startup)

| Email | Password | Role | Access URL |
|-------|----------|------|------------|
| `sarah@startupcorp.com` | `startup123!` | **OWNER** | `/tenants/startupcorp` |
| `david@startupcorp.com` | `startup123!` | **ADMIN** | `/tenants/startupcorp/settings` |
| `emma@startupcorp.com` | `startup123!` | **MEMBER** | `/dashboard` |
| `james@startupcorp.com` | `startup123!` | **MEMBER** | `/dashboard` |

**Company**: Tech startup focused on innovative solutions

---

## 🏢 InnovateInc (Consulting Company)

| Email | Password | Role | Access URL |
|-------|----------|------|------------|
| `marcus@innovateinc.com` | `innovate123!` | **OWNER** | `/tenants/innovateinc` |
| `lisa@innovateinc.com` | `innovate123!` | **ADMIN** | `/tenants/innovateinc/settings` |
| `maria@innovateinc.com` | `innovate123!` | **MEMBER** | `/dashboard` |
| `tom@innovateinc.com` | `innovate123!` | **MEMBER** | `/dashboard` |

**Company**: Consulting company specializing in business innovation

---

## 🏢 TechSolutions (Software Development)

| Email | Password | Role | Access URL |
|-------|----------|------|------------|
| `priya@techsolutions.com` | `tech123!` | **OWNER** | `/tenants/techsolutions` |
| `alex@techsolutions.com` | `tech123!` | **ADMIN** | `/tenants/techsolutions/settings` |
| `rachel@techsolutions.com` | `tech123!` | **MEMBER** | `/dashboard` |
| `kevin@techsolutions.com` | `tech123!` | **MEMBER** | `/dashboard` |

**Company**: Software development company building enterprise solutions

---

## 🧪 Demo Company (Testing)

| Email | Password | Role | Access URL |
|-------|----------|------|------------|
| `demo@saas-starter.com` | `demo123!` | **OWNER** | `/tenants/demo-company` |
| `testadmin@saas-starter.com` | `test123!` | **ADMIN** | `/tenants/demo-company/settings` |
| `guest@saas-starter.com` | `guest123!` | **MEMBER** | `/dashboard` |

**Company**: Demo organization for testing purposes

---

## 🎯 Testing Scenarios

### **Role-Based Access Control**
- **OWNER**: Full tenant management, billing, member invites
- **ADMIN**: Team management, settings, limited billing access
- **MEMBER**: Resource access, collaboration, basic features

### **Multi-Tenant Isolation**
- Users can only access their assigned tenant
- Test tenant switching and context isolation
- Verify data separation between organizations

### **Master Admin Testing**
- Access `/admin` with master admin credentials
- Manage all tenants from global perspective
- View system-wide audit logs and metrics

---

## 🚨 Quick Commands

```bash
# Create test users
npm run create-test-users

# Reset database (WARNING: Deletes ALL data)
npx prisma db push --force-reset

# Start development server
npm run dev

# Access application
http://localhost:4002
```

---

## 📱 Quick Login

**For Master Admin Testing:**
- Email: `admin@saas-starter.com`
- Password: `admin123!`
- URL: `http://localhost:4002/admin`

**For Tenant Testing:**
- Email: `sarah@startupcorp.com`
- Password: `startup123!`
- URL: `http://localhost:4002/tenants/startupcorp`

**For Demo Testing:**
- Email: `demo@saas-starter.com`
- Password: `demo123!`
- URL: `http://localhost:4002/tenants/demo-company`

---

*Last updated: $(Get-Date)*
*Script: `scripts/create-test-users.js`*
