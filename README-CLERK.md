# VsdvBillsoft - Clerk Authentication Integration

This document explains how to integrate Clerk authentication into VsdvBillsoft application.

## Overview

Clerk provides a complete authentication solution with:
- Built-in UI components for sign-in/sign-up
- Social login providers (Google, GitHub, etc.)
- User management dashboard
- JWT token management
- Session management

## Setup Instructions

### 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Create a new application
4. Note your **Publishable Key** from the API Keys section

### 2. Configure Environment Variables

Add your Clerk publishable key to `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3. Switch to Clerk Implementation

To use Clerk instead of Supabase authentication:

1. **Replace main.jsx** with the Clerk version:
   ```bash
   # Backup current file
   mv src/main.jsx src/main.supabase.jsx
   # Use Clerk version
   mv src/main.clerk.jsx src/main.jsx
   ```

2. **Replace App.jsx** with the Clerk version:
   ```bash
   # Backup current file
   mv src/App.jsx src/App.supabase.jsx
   # Use Clerk version
   mv src/App.clerk.jsx src/App.jsx
   ```

3. **Replace AuthContext.jsx** with the Clerk version:
   ```bash
   # Backup current file
   mv src/contexts/AuthContext.jsx src/contexts/AuthContext.supabase.jsx
   # Use Clerk version
   mv src/contexts/AuthContext.clerk.jsx src/contexts/AuthContext.jsx
   ```

4. **Replace components**:
   ```bash
   # Header
   mv src/components/Header.jsx src/components/Header.supabase.jsx
   mv src/components/Header.clerk.jsx src/components/Header.jsx
   
   # ProtectedRoute
   mv src/components/ProtectedRoute.jsx src/components/ProtectedRoute.supabase.jsx
   mv src/components/ProtectedRoute.clerk.jsx src/components/ProtectedRoute.jsx
   
   # Login Page
   mv src/pages/Login.jsx src/pages/Login.supabase.jsx
   mv src/pages/Login.clerk.jsx src/pages/Login.jsx
   
   # Register Page
   mv src/pages/Register.jsx src/pages/Register.supabase.jsx
   mv src/pages/Register.clerk.jsx src/pages/Register.jsx
   ```

### 4. Configure Clerk Dashboard

1. **Add Redirect URLs** in your Clerk dashboard:
   - Sign-in redirect: `http://localhost:5173/dashboard`
   - Sign-up redirect: `http://localhost:5173/dashboard`
   - Sign-out redirect: `http://localhost:5173/login`

2. **Enable Social Providers** (optional):
   - Go to User & Authentication → Social Connections
   - Enable Google, GitHub, or other providers
   - Configure OAuth credentials

3. **Customize Appearance** (optional):
   - Go to Customization → Appearance
   - Upload your logo
   - Customize colors and styling

## Features

### Authentication
- ✅ Email/password authentication
- ✅ Social login (Google, GitHub, etc.)
- ✅ Magic link authentication
- ✅ Multi-factor authentication
- ✅ Session management

### User Management
- ✅ User profiles with avatars
- ✅ Email verification
- ✅ Password reset
- ✅ Account deletion
- ✅ User metadata

### Security
- ✅ JWT tokens
- ✅ Secure session management
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Bot detection

## Components

### New Components
- `Login.clerk.jsx` - Sign-in page with Clerk's SignIn component
- `Register.clerk.jsx` - Sign-up page with Clerk's SignUp component
- `Header.clerk.jsx` - Header with UserButton for profile management
- `ProtectedRoute.clerk.jsx` - Route protection using Clerk's authentication state
- `AuthContext.clerk.jsx` - Context provider for Clerk authentication

### Utilities
- `clerkUtils.js` - Helper functions for authenticated requests and Supabase integration

## Usage Examples

### Making Authenticated Requests
```javascript
import { useAuthenticatedRequest } from '../utils/clerkUtils';

const MyComponent = () => {
  const authenticatedRequest = useAuthenticatedRequest();
  
  const fetchData = async () => {
    try {
      const data = await authenticatedRequest('/api/protected-endpoint');
      // Handle data
    } catch (error) {
      // Handle error
    }
  };
};
```

### Accessing User Information
```javascript
import { useUser } from '@clerk/clerk-react';

const MyComponent = () => {
  const { user, isSignedIn } = useUser();
  
  if (isSignedIn) {
    return <div>Welcome, {user.firstName}!</div>;
  }
  
  return <div>Please sign in</div>;
};
```

### Syncing with Supabase
```javascript
import { syncUserWithSupabase } from '../utils/clerkUtils';
import { useUser, useAuth } from '@clerk/clerk-react';
import { supabase } from '../supabaseClient';

const MyComponent = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  
  useEffect(() => {
    if (user) {
      syncUserWithSupabase(supabase, user, getToken);
    }
  }, [user, getToken]);
};
```

## Development vs Production

### Development
- Use test keys (pk_test_...)
- Localhost URLs in redirect settings
- Development mode in Clerk dashboard

### Production
- Use live keys (pk_live_...)
- Production URLs in redirect settings
- Production mode in Clerk dashboard

## Migration from Supabase Auth

If you're migrating from Supabase Auth:

1. **User Data**: Export user data from Supabase and import to Clerk
2. **Session Migration**: Users will need to sign in again
3. **API Integration**: Update API endpoints to validate Clerk JWTs
4. **Database**: Update user references to use Clerk user IDs

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set
   - Restart development server after adding env vars

2. **Redirect Issues**
   - Check redirect URLs in Clerk dashboard
   - Ensure URLs match exactly (including protocol)

3. **CORS Issues**
   - Configure allowed origins in Clerk dashboard
   - Check network requests in browser dev tools

4. **Authentication Loops**
   - Clear browser cache and cookies
   - Check protected route implementation

## Support

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Community](https://clerk.com/community)
- [GitHub Issues](https://github.com/clerk/clerk-react/issues)
