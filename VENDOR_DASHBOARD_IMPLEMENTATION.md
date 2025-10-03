# Vendor Dashboard Implementation Plan

**Date Created**: 2025-10-03
**Goal**: Fork and customize Medusa Admin Dashboard for vendor-only access at vendor.colabship.com

---

## Architecture Overview

### Current State
```
Medusa Backend (https://admin.colabship.com)
                ↓
        Super Admin UI
     (admin.colabship.com/app)
         Actor: user
```

### Target State
```
Medusa Backend (https://admin.colabship.com)
                ↓
        ┌───────┴───────┐
        ↓               ↓
Super Admin UI      Vendor UI
(Original)          (Forked)
admin.colabship.com vendor.colabship.com
Actor: user         Actor: vendor
```

### Benefits of This Approach
- ✅ Zero risk to super admin dashboard
- ✅ Clean separation of concerns
- ✅ Independent updates and deployments
- ✅ Custom branding per dashboard
- ✅ Simpler authentication (one actor type per dashboard)
- ✅ No complex role-based conditionals
- ✅ Shopify-like multi-tenant architecture

---

## Phase 1: Fork & Setup

### Step 1.1: Fork Medusa Admin Repository

```bash
# Clone the Medusa repository
git clone https://github.com/medusajs/medusa.git medusa-vendor-admin
cd medusa-vendor-admin

# Navigate to admin package
cd packages/admin

# Create new git repo for vendor admin
git init
git remote add origin <your-vendor-admin-repo-url>
git checkout -b main
git add .
git commit -m "Initial fork from Medusa admin for vendor dashboard"
```

### Step 1.2: Project Renaming

**Update `package.json`:**
```json
{
  "name": "@colabship/vendor-admin",
  "version": "1.0.0",
  "description": "Vendor Admin Dashboard for Colabship Marketplace",
  "repository": {
    "type": "git",
    "url": "https://github.com/colabship/vendor-admin"
  }
}
```

### Step 1.3: Environment Configuration

**Create `.env.production`:**
```bash
MEDUSA_BACKEND_URL=https://admin.colabship.com
MEDUSA_PUBLISHABLE_API_KEY=<your-publishable-key>
```

---

## Phase 2: Authentication Modifications

### Step 2.1: Identify Authentication Files

Key files to modify:
- `src/providers/auth-provider.tsx` - Main authentication logic
- `src/routes/login/login.tsx` - Login form
- `src/hooks/use-auth.ts` - Auth hooks
- `src/lib/client.ts` - API client configuration

### Step 2.2: Change Actor Type from "user" to "vendor"

**File: `src/providers/auth-provider.tsx`**

Find and replace:
```typescript
// BEFORE
const loginEndpoint = "/auth/user/emailpass"

// AFTER
const loginEndpoint = "/auth/vendor/emailpass"
```

**File: `src/routes/login/login.tsx`**

Update login handler:
```typescript
// BEFORE
const { mutateAsync } = useLogin({ provider: "emailpass", actor_type: "user" })

// AFTER
const { mutateAsync } = useLogin({ provider: "emailpass", actor_type: "vendor" })
```

### Step 2.3: Update Authentication State

**File: `src/providers/auth-provider.tsx`**

Ensure actor type is set correctly throughout:
```typescript
const AuthProvider = ({ children }: AuthProviderProps) => {
  const [actorType] = useState("vendor") // Changed from "user"

  // ... rest of provider logic
}
```

### Step 2.4: Remove "Register" and "Invite" Flows

Vendors are created by super admin only, not self-registered.

**File: `src/routes/login/login.tsx`**

Remove or hide:
- Registration link
- Forgot password link (if not needed)
- Invite acceptance flow

---

## Phase 3: UI Customizations

### Step 3.1: Remove Super Admin Features

**Features to Remove:**

1. **Vendor Management** - Only super admin manages vendors
   - Remove from navigation
   - Remove routes: `/vendors`, `/vendors/:id`

2. **System Settings** - Only super admin controls
   - Remove: API key management
   - Remove: Webhook management
   - Remove: Tax settings
   - Remove: Region settings
   - Remove: Currency settings
   - Remove: User management

3. **Store Settings** - Restrict to vendor-specific only
   - Keep: Store name/logo (vendor's own)
   - Remove: Global store settings

**Files to Modify:**

**`src/routes/routes.tsx`** - Remove routes:
```typescript
// REMOVE these routes
{
  path: "/settings/users",
  element: <Users />,
},
{
  path: "/settings/regions",
  element: <Regions />,
},
// ... other super admin routes
```

**`src/components/layout/sidebar/sidebar.tsx`** - Remove navigation items:
```typescript
// REMOVE from navigation
const navigationItems = [
  // Keep: Dashboard, Products, Orders
  // REMOVE: Vendors, Settings (system-level)
]
```

### Step 3.2: Keep Vendor-Specific Features

**Features to Keep:**

1. ✅ **Dashboard** - Vendor's overview
2. ✅ **Products** - Vendor's products only
3. ✅ **Orders** - Vendor's orders only
4. ✅ **Profile** - Vendor admin's profile
5. ✅ **Basic Settings** - Vendor's store info (name, logo)

### Step 3.3: Update API Endpoints

**File: `src/lib/client.ts`**

Ensure all API calls are scoped to vendor context:

```typescript
// Products endpoint should use /vendors/products
export const getProducts = async () => {
  return client.get("/vendors/products") // Changed from /admin/products
}

// Orders endpoint should use /vendors/orders
export const getOrders = async () => {
  return client.get("/vendors/orders") // Changed from /admin/orders
}
```

### Step 3.4: Branding Customization

**File: `src/components/layout/header/header.tsx`**

Update branding:
```typescript
const Header = () => {
  return (
    <div className="header">
      <h1>Colabship Vendor Dashboard</h1> {/* Changed from "Medusa Admin" */}
      {/* Update logo to vendor-specific branding */}
    </div>
  )
}
```

**Update theme/colors:**
- Create `src/styles/vendor-theme.css`
- Override primary colors to match Colabship branding
- Update favicon and logo assets

---

## Phase 4: Build & Deployment

### Step 4.1: Build Production Bundle

```bash
cd medusa-vendor-admin

# Install dependencies
npm install

# Build production bundle
npm run build

# Output will be in /dist directory
```

### Step 4.2: Deploy to DigitalOcean

**Option A: Deploy to Same Droplet (Recommended)**

**Create directory structure:**
```bash
ssh root@178.128.92.152

# Create vendor admin directory
mkdir -p /var/www/vendor.colabship.com
```

**Transfer build files:**
```bash
# From local machine
scp -r dist/* root@178.128.92.152:/var/www/vendor.colabship.com/
```

**Option B: Separate Droplet**

Create new $6/mo droplet for vendor dashboard (if needed for isolation).

### Step 4.3: Nginx Configuration

**Create: `/etc/nginx/sites-available/vendor.colabship.com`**

```nginx
server {
    listen 80;
    server_name vendor.colabship.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name vendor.colabship.com;

    # SSL certificates (use certbot)
    ssl_certificate /etc/letsencrypt/live/vendor.colabship.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vendor.colabship.com/privkey.pem;

    root /var/www/vendor.colabship.com;
    index index.html;

    # SPA routing - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass https://admin.colabship.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/vendor.colabship.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 4.4: SSL Certificate

```bash
# Install certbot if not already installed
apt install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d vendor.colabship.com

# Test auto-renewal
certbot renew --dry-run
```

### Step 4.5: DNS Configuration

**Add DNS record in your domain provider:**

```
Type: A
Name: vendor
Value: 178.128.92.152
TTL: 3600
```

Wait for DNS propagation (can take up to 48 hours, usually 5-30 minutes).

---

## Phase 5: Testing

### Step 5.1: Vendor Authentication Flow

**Test Case 1: Login**
1. Navigate to https://vendor.colabship.com
2. Enter vendor credentials (created via `/auth/vendor/emailpass/register` → `/vendors`)
3. Verify successful login
4. Check browser cookies/localStorage for auth token
5. Verify actor_type is "vendor" in JWT

**Test Case 2: Unauthorized Access**
1. Attempt to login with super admin (user) credentials
2. Should fail - wrong actor type
3. Attempt to login with customer credentials
4. Should fail - wrong actor type

### Step 5.2: Product Management

**Test Case 3: View Products**
1. Login as vendor
2. Navigate to Products page
3. Verify only vendor's products are shown
4. Check API call goes to `/vendors/products`

**Test Case 4: Create Product**
1. Click "Create Product"
2. Fill in product details
3. Submit
4. Verify product created and linked to vendor
5. Check product appears in list

**Test Case 5: Edit Product**
1. Click on existing product
2. Modify details
3. Save
4. Verify changes persisted

### Step 5.3: Order Viewing

**Test Case 6: View Orders**
1. Navigate to Orders page
2. Verify only vendor's orders are shown
3. Check API call goes to `/vendors/orders`
4. Verify correct order details displayed

**Test Case 7: Order Details**
1. Click on an order
2. Verify all order information visible
3. Check line items match vendor's products

### Step 5.4: Profile Management

**Test Case 8: View Profile**
1. Navigate to Profile/Settings
2. Verify vendor admin details shown
3. Check vendor name, logo displayed

**Test Case 9: Update Profile**
1. Edit vendor admin name
2. Save
3. Verify changes persisted

### Step 5.5: Security Testing

**Test Case 10: Prevent Super Admin Features Access**
1. Manually navigate to `/settings/users` (if route exists)
2. Should show 404 or redirect
3. Attempt direct API call to `/admin/products`
4. Should be unauthorized (vendor token not valid for admin endpoints)

**Test Case 11: Cross-Vendor Access**
1. Login as Vendor A
2. Attempt to access Vendor B's product (if ID known)
3. Should be denied

---

## Phase 6: Maintenance Strategy

### Step 6.1: Version Control

**Branch Strategy:**
```
main - Production vendor dashboard
upstream - Mirror of official Medusa admin
feature/* - New features for vendor dashboard
hotfix/* - Urgent fixes
```

**Keep upstream in sync:**
```bash
# Add Medusa as upstream remote
git remote add upstream https://github.com/medusajs/medusa.git

# Periodically fetch updates
git fetch upstream
git checkout upstream
git merge upstream/main

# Review changes and cherry-pick to main
git checkout main
git cherry-pick <commit-hash>
```

### Step 6.2: Update Process

**Monthly Review:**
1. Check Medusa releases: https://github.com/medusajs/medusa/releases
2. Review changelog for admin changes
3. Identify breaking changes
4. Test updates on staging environment
5. Merge compatible updates

### Step 6.3: CI/CD Pipeline

**GitHub Actions Workflow:**

**`.github/workflows/deploy-vendor-admin.yml`:**
```yaml
name: Deploy Vendor Admin

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          MEDUSA_BACKEND_URL: https://admin.colabship.com

      - name: Deploy to DigitalOcean
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "dist/*"
          target: "/var/www/vendor.colabship.com/"
          strip_components: 1
```

### Step 6.4: Monitoring

**Setup monitoring for:**
- Uptime (vendor.colabship.com)
- Response times
- Error rates
- Failed logins
- API errors

**Tools:**
- DigitalOcean monitoring
- UptimeRobot
- Sentry for error tracking

---

## Phase 7: Documentation

### Step 7.1: Vendor Onboarding Guide

**Create: `VENDOR_GUIDE.md`**

Include:
- How to access vendor dashboard
- Login instructions
- Product management guide
- Order management guide
- Profile settings
- Support contact

### Step 7.2: Developer Documentation

**Create: `VENDOR_ADMIN_DEV.md`**

Include:
- Architecture overview
- Modified files list
- API endpoints used
- Authentication flow
- Deployment process
- Troubleshooting guide

---

## Implementation Checklist

### Phase 1: Fork & Setup
- [ ] Fork Medusa admin repository
- [ ] Rename project to `@colabship/vendor-admin`
- [ ] Configure environment variables
- [ ] Push to new repository

### Phase 2: Authentication
- [ ] Change login endpoint to `/auth/vendor/emailpass`
- [ ] Update actor type from "user" to "vendor"
- [ ] Remove registration/invite flows
- [ ] Test vendor login

### Phase 3: UI Customization
- [ ] Remove vendor management routes
- [ ] Remove system settings
- [ ] Update API endpoints to `/vendors/*`
- [ ] Update branding (logo, colors, name)
- [ ] Remove super admin navigation items

### Phase 4: Build & Deploy
- [ ] Build production bundle
- [ ] Create nginx configuration
- [ ] Setup SSL certificate
- [ ] Configure DNS
- [ ] Deploy to vendor.colabship.com

### Phase 5: Testing
- [ ] Test vendor login
- [ ] Test product management (view, create, edit)
- [ ] Test order viewing
- [ ] Test profile management
- [ ] Security testing (unauthorized access prevention)

### Phase 6: Maintenance
- [ ] Setup version control strategy
- [ ] Create CI/CD pipeline
- [ ] Setup monitoring
- [ ] Document update process

### Phase 7: Documentation
- [ ] Create vendor onboarding guide
- [ ] Create developer documentation
- [ ] Document API changes
- [ ] Create troubleshooting guide

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Fork & Setup | 2 hours |
| Phase 2 | Authentication | 4 hours |
| Phase 3 | UI Customization | 8 hours |
| Phase 4 | Build & Deploy | 4 hours |
| Phase 5 | Testing | 6 hours |
| Phase 6 | Maintenance Setup | 3 hours |
| Phase 7 | Documentation | 3 hours |
| **Total** | | **30 hours** |

---

## Risk Assessment

### High Risk
- **Authentication breaking changes** in Medusa updates
  - Mitigation: Pin Medusa version, test updates thoroughly

### Medium Risk
- **API endpoint changes** breaking vendor dashboard
  - Mitigation: Monitor Medusa changelog, use API versioning if available

### Low Risk
- **UI component breaking changes**
  - Mitigation: Custom components for critical features

---

## Success Criteria

✅ Vendors can login at vendor.colabship.com
✅ Vendors see only their products and orders
✅ Vendors cannot access super admin features
✅ Zero impact on super admin dashboard
✅ Dashboard is fast and responsive
✅ SSL certificate active and auto-renewing
✅ Monitoring alerts setup
✅ Documentation complete

---

## Next Steps After Implementation

1. **Phase 2 Features** (from MARKETPLACE_IMPLEMENTATION_PHASE1.md):
   - Super admin vendor management UI (in admin.colabship.com)
   - Vendor analytics dashboard
   - Vendor reporting features

2. **Enhanced Vendor Features**:
   - Product variants management
   - Inventory tracking
   - Sales analytics
   - Payout management

3. **Multi-Language Support**:
   - Internationalization (i18n)
   - RTL support if needed

---

## Resources

- **Medusa Admin Source**: https://github.com/medusajs/medusa/tree/main/packages/admin
- **Medusa Auth Docs**: https://docs.medusajs.com/resources/references/auth
- **Nginx Docs**: https://nginx.org/en/docs/
- **Certbot**: https://certbot.eff.org/

---

## Support

For issues or questions:
- Check troubleshooting section in VENDOR_ADMIN_DEV.md
- Review Medusa Discord: https://discord.gg/medusajs
- Create issue in vendor-admin repository

---

**Last Updated**: 2025-10-03
**Status**: Ready for Implementation
**Owner**: Colabship Team
