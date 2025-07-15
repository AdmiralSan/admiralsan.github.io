# VsdvBillsoft Authentication System

This document describes the authentication system used in VsdvBillsoft application.

## Authentication Overview

The application uses Supabase for authentication with JWT tokens. The custom login system has been removed in favor of using Supabase's built-in authentication with OAuth providers (Google and GitHub).

## How Authentication Works

1. **Sign In**: Users sign in through the OAuth providers (Google or GitHub)
2. **JWT Token**: Upon successful authentication, Supabase issues a JWT token
3. **Session Management**: The JWT token is stored and managed by the Supabase client
4. **Protected Routes**: Routes in the application check for the presence of a valid JWT token
5. **API Requests**: API requests include the JWT token in the Authorization header

## Files Modified

1. **AuthContext.jsx**: Simplified to focus on Supabase JWT authentication
2. **Login.jsx**: Updated to only use social login providers
3. **AuthCallback.jsx**: Enhanced to handle JWT tokens explicitly
4. **ProtectedRoute.jsx**: Simplified to just check for a valid JWT token
5. **apiUtils.js (new)**: Added utility functions for making authenticated API requests

## How to Log In

Users can log in using:
- Google account
- GitHub account

The email/password login option has been removed.

## JWT Token Usage

The JWT token is used for:
- Authenticating API requests
- Maintaining user sessions
- Protecting routes

## Security Considerations

- JWT tokens are never exposed in the UI
- Tokens are stored securely by the Supabase client
- Token expiration is handled automatically
- API requests use the token for authorization

## Development Notes

When making API requests to protected endpoints, use the `authenticatedRequest` function from `apiUtils.js`:

```javascript
import { authenticatedRequest } from '../utils/apiUtils';

// Example usage
const fetchData = async () => {
  try {
    const data = await authenticatedRequest('/api/protected-endpoint', {
      method: 'GET'
    });
    // Handle the data
  } catch (error) {
    // Handle errors
  }
};
```

This ensures the JWT token is included in the request headers.