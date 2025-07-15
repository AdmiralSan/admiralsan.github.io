# Quick Start Guide

## 1. Install Dependencies
```bash
npm install @clerk/clerk-react
```

## 2. Environment Variables
Create `.env.local`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
```

## 3. Wrap App with ClerkProvider
In your main App component:
```jsx
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      {/* Your existing app */}
    </ClerkProvider>
  );
}
```

## 4. Add Organization Support
Add to your header/navigation:
```jsx
import { OrganizationSwitcher } from '@clerk/clerk-react';

function Header() {
  return (
    <div>
      {/* Your existing header */}
      <OrganizationSwitcher />
    </div>
  );
}
```

## 5. Test
- Navigate to User Management page
- Create an organization if prompted
- Try inviting a user

For detailed setup, see CLERK-USER-MANAGEMENT-SETUP.md
