// Utility functions for Clerk user management
import { supabase } from '../supabaseClient';

// Function to ensure user exists in database
export const ensureUserExists = async (clerkUser) => {
  try {
    if (!clerkUser || !clerkUser.id) {
      throw new Error('No valid Clerk user provided');
    }

    // First check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', clerkUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      console.error('Error checking if user exists:', checkError);
      throw checkError;
    }

    if (existingUser) {
      // User exists, optionally update their info
      const userData = {
        email: clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email || existingUser.email,
        full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || existingUser.full_name,
        avatar_url: clerkUser.imageUrl || existingUser.avatar_url,
        updated_at: new Date().toISOString()
      };

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', clerkUser.id)
        .select()
        .single();

      if (updateError) {
        console.warn('Could not update user info:', updateError);
        // Return existing user even if update failed
        return existingUser;
      }

      return updatedUser;
    }

    // User doesn't exist, create them
    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email || '',
      full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      avatar_url: clerkUser.imageUrl || null,
      clerk_user_id: clerkUser.id
    };

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('Successfully created user in database:', newUser.id);
    return newUser;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    throw error;
  }
};

// Function to get current user ID for database operations
export const getCurrentUserId = async () => {
  try {
    // Get current user from Clerk
    if (typeof window !== 'undefined' && window.Clerk) {
      const clerkUser = window.Clerk.user;
      if (clerkUser) {
        // Ensure user exists in database
        await ensureUserExists(clerkUser);
        return clerkUser.id;
      }
    }
    
    throw new Error('No authenticated user found');
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw error;
  }
};

// Function to sync Clerk user with database
export const syncClerkUser = async (clerkUser) => {
  try {
    if (!clerkUser || !clerkUser.id) {
      throw new Error('No valid Clerk user provided');
    }

    const userData = {
      id: clerkUser.id,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || clerkUser.email || '',
      full_name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      avatar_url: clerkUser.imageUrl || null,
      clerk_user_id: clerkUser.id
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(userData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error syncing Clerk user:', error);
    throw error;
  }
};

// Function to get user by Clerk ID
export const getUserByClerkId = async (clerkUserId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting user by Clerk ID:', error);
    throw error;
  }
};
