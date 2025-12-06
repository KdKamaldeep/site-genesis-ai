# Migration from Next.js to React + Vite + TypeScript

## ✅ Completed

1. **Vite Configuration**
   - Created `vite.config.ts` with React plugin and path aliases
   - Updated `package.json` with Vite dependencies
   - Created `tsconfig.json` and `tsconfig.node.json` for Vite

2. **Core Files**
   - `src/main.tsx` - Entry point with React Router
   - `src/App.tsx` - Main app with routing setup
   - `src/index.css` - Global styles
   - `src/api-client.ts` - Updated to use `import.meta.env` instead of `process.env`
   - `src/lib/utils.ts` - Utility functions
   - `src/types/index.ts` - TypeScript types

3. **Layout Components**
   - `src/components/layout/sidebar.tsx` - Converted to use React Router (`useLocation`, `useNavigate`, `Link`)
   - `src/components/layout/main-layout.tsx` - Updated

4. **UI Components**
   - All UI components copied to `src/components/ui/`
   - Updated imports to use `@/` alias

5. **Pages**
   - `src/pages/LoginPage.tsx` - Converted (uses `useNavigate` instead of `useRouter`)

## 🔄 Need to Convert

Convert these pages from Next.js to React Router:

1. **TenantsPage** (`app/tenants/page.tsx` → `src/pages/TenantsPage.tsx`)
   - Replace `useRouter` with `useNavigate`
   - Replace `Link` from `next/link` with `Link` from `react-router-dom`
   - Remove `MainLayout` wrapper (handled in App.tsx)
   - Update imports to use `@/api-client` instead of `../api-client`

2. **TenantDetailPage** (`app/tenants/[id]/page.tsx` → `src/pages/TenantDetailPage.tsx`)
   - Replace `useParams` from `next/navigation` with `useParams` from `react-router-dom`
   - Update all imports

3. **KeywordsPage** (`app/keywords/page.tsx` → `src/pages/KeywordsPage.tsx`)
   - Same conversion pattern

4. **ContentPage** (`app/content/page.tsx` → `src/pages/ContentPage.tsx`)
   - Same conversion pattern

5. **TemplatesPage** (`app/templates/page.tsx` → `src/pages/TemplatesPage.tsx`)
   - Same conversion pattern

6. **SchedulerPage** (`app/scheduler/page.tsx` → `src/pages/SchedulerPage.tsx`)
   - Same conversion pattern

7. **SettingsPage** (`app/settings/page.tsx` → `src/pages/SettingsPage.tsx`)
   - Same conversion pattern

## 📝 Conversion Pattern

### Before (Next.js):
```tsx
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const router = useRouter()
router.push('/path')
const params = useParams()
```

### After (React Router):
```tsx
import { useNavigate, Link, useParams } from 'react-router-dom'

const navigate = useNavigate()
navigate('/path')
const { id } = useParams<{ id: string }>()
```

## 🚀 Running the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```
   VITE_API_URL=http://localhost:5000
   ```

3. Run dev server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## ⚠️ Important Notes

- All environment variables must be prefixed with `VITE_` in Vite
- React Router uses `BrowserRouter` instead of Next.js file-based routing
- No more `'use client'` directives needed
- All pages are now regular React components
- Protected routes are handled in `App.tsx` with a `ProtectedRoute` component

