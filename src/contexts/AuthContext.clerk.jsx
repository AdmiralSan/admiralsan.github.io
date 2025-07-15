import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Keep the old useAuth hook for backward compatibility
export const useAuth = () => {
  return useAuthContext();
};

export const AuthProvider = ({ children }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut, getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (userLoaded) {
      setIsLoading(false);
    }
  }, [userLoaded]);

  const logout = async () => {
    try {
      setAuthError(null);
      await signOut();
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
      return { error };
    }
  };

  const getAuthToken = async () => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  // For backward compatibility with existing code
  const signInWithProvider = async (provider) => {
    // This will be handled by Clerk's UI components
    console.warn('signInWithProvider is deprecated. Use Clerk\'s SignIn component instead.');
    return { data: null, error: new Error('Use Clerk SignIn component') };
  };

  const value = {
    user,
    session: { user }, // For backward compatibility
    loading: isLoading,
    isSignedIn,
    authError,
    signInWithProvider,
    signOut: logout,
    clearAuthError,
    getToken: getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
