import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { usePermissions } from '../contexts/PermissionsContext';

const AdminSetup = () => {
  const { user } = useUser();
  const { userRole, hasPermission } = usePermissions();
  const [showInstructions, setShowInstructions] = useState(true);

  // Check if user is already admin
  const isAdmin = userRole === 'admin';

  if (isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <h2 className="text-xl font-bold mb-2">✅ You're already an Admin!</h2>
          <p>Your account has admin privileges. You can access all features including User Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Account Setup</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <h2 className="text-lg font-bold mb-2">⚠️ Current Status</h2>
        <p>Your current role: <strong>{userRole || 'No role assigned'}</strong></p>
        <p>You need admin privileges to access User Management and other admin features.</p>
      </div>

      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">📋 How to Set Up Admin Role</h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-blue-700 mb-2">Method 1: Clerk Dashboard (Recommended)</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to your <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Clerk Dashboard</a></li>
                <li>Navigate to <strong>Users</strong> section</li>
                <li>Find your user: <code className="bg-gray-100 px-2 py-1 rounded">{user?.emailAddresses?.[0]?.emailAddress}</code></li>
                <li>Click on your user to edit</li>
                <li>Go to the <strong>Metadata</strong> tab</li>
                <li>In <strong>Public metadata</strong>, add:
                  <pre className="bg-gray-100 p-2 mt-2 rounded text-xs">
{`{
  "role": "admin"
}`}
                  </pre>
                </li>
                <li>Save the changes</li>
                <li>Refresh this page</li>
              </ol>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-green-700 mb-2">Method 2: Organization Role</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Create an organization in Clerk Dashboard</li>
                <li>Invite yourself as <strong>org:admin</strong></li>
                <li>Accept the invitation</li>
                <li>The system will automatically detect your admin role</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-bold text-purple-700 mb-2">Method 3: Backend API (For Developers)</h3>
              <p className="text-sm mb-2">Use Clerk's Backend API to update user metadata programmatically:</p>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{`// Using Clerk Backend API
import { clerkClient } from '@clerk/clerk-sdk-node';

await clerkClient.users.updateUserMetadata('${user?.id}', {
  publicMetadata: {
    role: 'admin'
  }
});`}
              </pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded">
            <h4 className="font-bold text-amber-800 mb-2">🎯 Available Roles:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>admin</strong> - Full access to all features</li>
              <li><strong>manager</strong> - Can manage inventory, products, reports</li>
              <li><strong>staff</strong> - Can view and edit basic inventory</li>
              <li><strong>viewer</strong> - Read-only access</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Check Role Status
        </button>
        
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center"
        >
          Open Clerk Dashboard
        </a>
      </div>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-bold text-gray-800 mb-2">🔍 Current User Info:</h3>
        <div className="text-sm space-y-1">
          <div><strong>Email:</strong> {user?.emailAddresses?.[0]?.emailAddress}</div>
          <div><strong>User ID:</strong> {user?.id}</div>
          <div><strong>Current Role:</strong> {userRole || 'None'}</div>
          <div><strong>Public Metadata:</strong> {JSON.stringify(user?.publicMetadata) || 'None'}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
