import { useUser, useAuth } from '@clerk/clerk-react';

// Example component showing how to use Clerk hooks
export function UserProfile() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <div>Please sign in to view your profile</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <img 
          src={user.imageUrl} 
          alt={user.fullName} 
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h2 className="text-lg font-semibold">{user.fullName}</h2>
          <p className="text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        <p><strong>Last Sign In:</strong> {new Date(user.lastSignInAt).toLocaleDateString()}</p>
      </div>
      
      <button 
        onClick={() => signOut()}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  );
}

// Example of making authenticated requests
export async function makeAuthenticatedRequest(url, options = {}) {
  const { getToken } = useAuth();
  
  try {
    const token = await getToken();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
}
