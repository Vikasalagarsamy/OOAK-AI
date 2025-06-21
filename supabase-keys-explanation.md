# 🔑 Supabase Keys Explanation for Next.js

## Two Different Keys for Two Different Purposes

### 🌐 NEXT_PUBLIC_SUPABASE_ANON_KEY (Client-Side)
**Used in:** React components, pages, client-side code

```javascript
// ✅ Client-side usage (components/pages)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // 👈 ANON key
)

// Examples:
// - User login/logout
// - Fetching user's own data
// - Public data queries
// - Real-time subscriptions
```

### 🛡️ SUPABASE_SERVICE_ROLE_KEY (Server-Side)
**Used in:** API routes (`/api/*`), server functions, admin operations

```javascript
// ✅ Server-side usage (API routes)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // 👈 SERVICE key
)

// Examples:
// - Admin data modifications
// - Bypassing Row Level Security
// - User management operations
// - Background data processing
```

## 📁 Real Examples in Your App

### Client-Side Component
```jsx
// pages/dashboard.js or components/UserProfile.js
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Dashboard() {
  const supabase = useSupabaseClient() // Uses ANON key automatically
  
  const fetchMyData = async () => {
    const { data } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)  // Only user's own data
  }
}
```

### Server-Side API Route
```javascript
// pages/api/admin/users.js
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Admin access
)

export default async function handler(req, res) {
  // Admin operation - can access all data
  const { data } = await supabaseAdmin
    .from('user_accounts')
    .select('*')  // Can see ALL users (admin access)
    
  res.json(data)
}
```

## 🎯 Do You Need Both?

### ✅ YES - You need BOTH if you have:
- User authentication
- Client-side data fetching
- API routes for admin operations
- Server-side data processing

### ⚠️ MAYBE - You only need ANON key if:
- Simple read-only app
- No server-side operations
- No admin functionality

### 🚨 NEVER - Don't use SERVICE key for:
- Client-side components
- Frontend operations
- Anything that runs in the browser

## 🔒 Security Best Practices

### ✅ SAFE:
```javascript
// Client-side (components, pages)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### ❌ DANGEROUS:
```javascript
// NEVER do this in client-side code!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // 🚨 SECURITY RISK!
)
```

## 📋 Your Current Setup Summary

✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**: For client-side operations  
✅ **SUPABASE_SERVICE_ROLE_KEY**: For server-side/admin operations  
✅ **Both are properly configured in your .env.local**  
✅ **Both are needed for a full Next.js application**

## 🎯 Recommendation: KEEP BOTH

Your application likely uses both client-side and server-side operations, so you need both keys for full functionality. 