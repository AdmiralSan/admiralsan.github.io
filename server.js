// server.js
import express from 'express';
import cors from 'cors';
import { Clerk } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

dotenv.config();

const clerk = Clerk({ apiKey: process.env.CLERK_SECRET_KEY });
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware to verify Clerk tokens
const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    // Verify the token with Clerk
    try {
      const session = await clerk.verifyToken(token);
      req.user = session;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// API route to fetch users
app.get('/api/clerk/users', verifyClerkToken, async (req, res) => {
  try {
    // Fetch users from Clerk
    const users = await clerk.users.getUserList({
      limit: 100,
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Endpoint to update user role in Clerk
app.post('/api/clerk/users/update-role', verifyClerkToken, async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing required fields: userId and role' });
    }

    // Check if the authenticated user has permission to update roles
    // This would typically involve checking the user's role in your database
    // For simplicity, we're just checking if they're authenticated

    // Update the user's metadata in Clerk
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        role
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Endpoint to get role counts
app.get('/api/clerk/organization/roles/count', verifyClerkToken, async (req, res) => {
  try {
    // Get the organization ID from the authenticated user
    const userId = req.user.sub;
    const user = await clerk.users.getUser(userId);
    const memberships = await clerk.users.getOrganizationMembershipList({
      userId: user.id
    });
    
    if (memberships.length === 0) {
      return res.status(404).json({ error: 'User not in any organization' });
    }
    
    const organizationId = memberships[0].organization.id;
    
    // Get organization members
    const members = await clerk.organizations.getOrganizationMembershipList({
      organizationId
    });
    
    // Count members by role
    const roleCounts = {};
    members.forEach(member => {
      const role = member.role;
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    res.json(roleCounts);
  } catch (error) {
    console.error('Error getting role counts:', error);
    res.status(500).json({ error: 'Failed to get role counts' });
  }
});

app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
