// API routes for Clerk user management
// This file should be placed in your backend API structure
// For example: /api/clerk/users.js (if using Next.js) or similar

import { clerkClient } from '@clerk/clerk-sdk-node';
import { verifyToken } from '../middleware/auth';

// Initialize Clerk with your secret key
// Make sure to set CLERK_SECRET_KEY in your environment variables

export async function GET(request) {
  try {
    // Verify the request is authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to view users
    // This should be implemented based on your permission system
    const hasPermission = await checkUserPermission(authResult.userId, 'users:view');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch all users from Clerk
    const users = await clerkClient.users.getUserList({
      limit: 500, // Adjust as needed
      orderBy: '-created_at'
    });

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request) {
  try {
    // Verify the request is authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to create users
    const hasPermission = await checkUserPermission(authResult.userId, 'users:create');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { emailAddress, firstName, lastName, phoneNumber, password, publicMetadata } = body;

    // Validate required fields
    if (!emailAddress || !firstName || !lastName || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create user in Clerk
    const user = await clerkClient.users.createUser({
      emailAddress: [emailAddress],
      firstName,
      lastName,
      phoneNumber: phoneNumber ? [phoneNumber] : undefined,
      password,
      publicMetadata: publicMetadata || {},
      privateMetadata: {},
      unsafeMetadata: {}
    });

    return new Response(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle Clerk-specific errors
    if (error.errors) {
      const clerkError = error.errors[0];
      return new Response(JSON.stringify({ error: clerkError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Individual user operations
export async function PATCH(request, { params }) {
  try {
    const { userId } = params;
    
    // Verify the request is authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to edit users
    const hasPermission = await checkUserPermission(authResult.userId, 'users:edit');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { firstName, lastName, phoneNumber, publicMetadata } = body;

    // Update user in Clerk
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? [phoneNumber] : [];
    }
    if (publicMetadata !== undefined) updateData.publicMetadata = publicMetadata;

    const user = await clerkClient.users.updateUser(userId, updateData);

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.errors) {
      const clerkError = error.errors[0];
      return new Response(JSON.stringify({ error: clerkError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to update user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = params;
    
    // Verify the request is authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to delete users
    const hasPermission = await checkUserPermission(authResult.userId, 'users:delete');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent users from deleting themselves
    if (userId === authResult.userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete user from Clerk
    await clerkClient.users.deleteUser(userId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.errors) {
      const clerkError = error.errors[0];
      return new Response(JSON.stringify({ error: clerkError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Password reset endpoint
export async function resetPassword(request, { params }) {
  try {
    const { userId } = params;
    
    // Verify the request is authenticated
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user has permission to reset passwords
    const hasPermission = await checkUserPermission(authResult.userId, 'users:edit');
    if (!hasPermission) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user's email from Clerk
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
    
    if (!primaryEmail) {
      return new Response(JSON.stringify({ error: 'User has no primary email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Send password reset email
    await clerkClient.emails.createEmail({
      emailAddressId: primaryEmail.id,
      fromEmailName: 'noreply',
      subject: 'Reset your password',
      body: 'Please click the link below to reset your password...',
      bodyPlain: 'Please click the link below to reset your password...'
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error sending password reset:', error);
    
    if (error.errors) {
      const clerkError = error.errors[0];
      return new Response(JSON.stringify({ error: clerkError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Failed to send password reset email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to verify token (implement this based on your setup)
async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No token provided' };
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Clerk
    const payload = await clerkClient.verifyToken(token);
    
    return { success: true, userId: payload.sub };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}

// Helper function to check user permissions (implement based on your permission system)
async function checkUserPermission(userId, permission) {
  // This should check your permission system
  // For example, check the user's role in your database
  // and verify they have the required permission
  
  // Placeholder implementation - replace with your actual logic
  try {
    // Query your database to get user role and check permissions
    // This is just an example structure
    return true; // Replace with actual permission check
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}
