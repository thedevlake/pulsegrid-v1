# Role Hierarchy & Permissions

PulseGrid implements a three-tier role-based access control (RBAC) system to ensure proper data isolation and security across organizations.

## 🎯 Role Overview

### ✅ Super Admin

**The Super Admin is the highest-level user in the system.**

- **Platform-wide access**: Oversees the entire platform, including all organizations and all users
- **Unrestricted permissions**: Can view, manage, and modify any organization, handle platform-wide settings, and access every resource regardless of organization boundaries
- **User management**: Can create users in any organization, promote users to admin or super_admin, and demote super_admins (with safeguards)
- **System metrics**: Sees aggregated metrics across all organizations
- **Bootstrap**: The first user to register automatically becomes super_admin

**Access Scope:**

- All organizations
- All users
- All services
- All health checks
- All alerts
- System-wide analytics

---

### ✅ Organization Admin

**The Organization Admin manages everything within their own organization.**

- **Organization-scoped access**: Can invite users, remove users, update organization settings, manage services, review alerts, and access internal analytics — but only for their organization
- **Data isolation**: Does not have access to data or users from other organizations
- **User management**: Can create users within their organization (as `user` or `admin` roles)
- **Service management**: Full CRUD operations on services within their organization
- **Analytics**: Can view metrics and reports for their organization only

**Access Scope:**

- Their own organization only
- Users within their organization
- Services within their organization
- Health checks for their organization's services
- Alerts for their organization's services
- Organization-specific analytics

**Restrictions:**

- Cannot access other organizations
- Cannot create super_admin users
- Cannot promote users to super_admin
- Cannot see system-wide metrics

---

### ✅ Standard User

**A Standard User belongs to a single organization and can only access content that is assigned to them.**

- **Limited access**: Can interact with services, view alerts, and use features their organization admin enables
- **Read-only operations**: Can view services, health checks, alerts, and reports within their organization
- **No management**: Cannot manage users or modify organization settings
- **Default role**: All new registrations (except the first user) default to this role

**Access Scope:**

- View services in their organization
- View health checks for their organization's services
- View alerts for their organization's services
- View reports and analytics for their organization
- Create alert subscriptions

**Restrictions:**

- Cannot create, update, or delete services
- Cannot manage users
- Cannot access admin panel
- Cannot modify organization settings
- Cannot view other organizations' data

---

## 📋 Summary

| Role                   | Platform Access      | Organization Access  | User Management                | Service Management  |
| ---------------------- | -------------------- | -------------------- | ------------------------------ | ------------------- |
| **Super Admin**        | ✅ All organizations | ✅ All organizations | ✅ Create/promote/demote users | ✅ All services     |
| **Organization Admin** | ❌ Own org only      | ✅ Own organization  | ✅ Create users in own org     | ✅ Own org services |
| **Standard User**      | ❌ Own org only      | ✅ Own organization  | ❌ No access                   | ❌ View only        |

---

## 🔐 Security Features

### Role Assignment

1. **Registration Flow:**

   - First user → `super_admin` (bootstrap)
   - All subsequent users → `user` (default, secure)

2. **Admin Creation:**

   - Only existing `admin` or `super_admin` can create users
   - Can assign `user` or `admin` roles when creating
   - Cannot create `super_admin` via create endpoint

3. **Super Admin Promotion:**
   - Only `super_admin` can promote users to `super_admin`
   - Done via admin panel promotion button
   - Cannot demote the last super_admin (safeguard)

### Data Isolation

- **Organization filtering**: All queries automatically filter by organization_id for admin and user roles
- **Super admin bypass**: Super admin queries bypass organization filters to see all data
- **Middleware enforcement**: Role-based middleware ensures proper access control at the API level

### API Endpoints

- **Protected routes**: Require authentication (all logged-in users)
- **Admin routes**: Require `admin` or `super_admin` role (`/admin/*`)
- **Super admin routes**: Require `super_admin` role only (`/admin/super/*`)

---

## 🚀 Usage Examples

### Super Admin Workflow

1. First user registers → automatically becomes `super_admin`
2. Super admin logs in → sees all organizations and users
3. Super admin creates organization admin → assigns `admin` role
4. Super admin can promote any user to `super_admin` if needed

### Organization Admin Workflow

1. Organization admin logs in → sees only their organization
2. Creates users → assigns `user` or `admin` roles (within their org)
3. Manages services → full CRUD for their organization's services
4. Views analytics → organization-specific metrics only

### Standard User Workflow

1. User registers → automatically becomes `user` role
2. User logs in → sees only their organization's services
3. Views health checks, alerts, and reports → read-only access
4. Creates alert subscriptions → can subscribe to notifications

---

## 📝 Implementation Details

### Backend

- **Role checking**: Middleware validates roles at API endpoints
- **Organization filtering**: Handlers automatically filter by organization_id
- **Query isolation**: Database queries include organization_id WHERE clauses for non-super-admin users

### Frontend

- **UI visibility**: Admin panel only visible to `admin` and `super_admin` roles
- **Feature gating**: Create/edit/delete buttons hidden for `user` role
- **Role badges**: Visual indicators show user roles (purple for super_admin, blue for admin, gray for user)

---

## 🔄 Role Transitions

| From          | To            | Method                      | Who Can Do It                           |
| ------------- | ------------- | --------------------------- | --------------------------------------- |
| `user`        | `admin`       | Create user with admin role | `admin`, `super_admin`                  |
| `user`        | `super_admin` | Promote button              | `super_admin` only                      |
| `admin`       | `super_admin` | Promote button              | `super_admin` only                      |
| `super_admin` | `admin`       | Demote button               | `super_admin` only (not self, not last) |

---

_Last updated: Implementation complete with full multi-tenant isolation_
