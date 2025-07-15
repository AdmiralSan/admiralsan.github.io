import { useAuth } from '@clerk/clerk-react';

// Hook to get authenticated request function
export const useAuthenticatedRequest = () => {
  const { getToken } = useAuth();

  const authenticatedRequest = async (url, options = {}) => {
    try {
      const token = await getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  };

  return authenticatedRequest;
};

// Utility function for making authenticated requests outside of React components
export const createAuthenticatedRequest = (getToken) => {
  return async (url, options = {}) => {
    try {
      const token = await getToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Authenticated request error:', error);
      throw error;
    }
  };
};

// Supabase integration with Clerk token
export const getSupabaseWithAuth = async (supabaseClient, getToken) => {
  const token = await getToken();
  
  if (token) {
    // Set the JWT token for Supabase requests
    supabaseClient.auth.setAuth(token);
  }
  
  return supabaseClient;
};

// Helper function to sync Clerk user with Supabase
export const syncUserWithSupabase = async (supabaseClient, user, getToken) => {
  try {
    const token = await getToken();
    
    if (!token || !user) {
      throw new Error('No authentication token or user data');
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: fetchError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const userData = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      avatar_url: user.imageUrl || '',
      updated_at: new Date().toISOString(),
    };

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabaseClient
        .from('users')
        .update(userData)
        .eq('id', user.id);

      if (updateError) throw updateError;
    } else {
      // Create new user
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert({
          ...userData,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    return userData;
  } catch (error) {
    console.error('Error syncing user with Supabase:', error);
    throw error;
  }
};
