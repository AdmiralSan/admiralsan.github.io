import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

// Create the auth context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [authError, setAuthError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        
        // Listen for auth changes
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            setLoading(false);
          }
        );
        
        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Sign in with social provider
  const signInWithProvider = async (provider) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with provider:', error);
      setAuthError(error.message);
      return { data: null, error };
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      setAuthError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      setAuthError(error.message);
      return { error };
    }
  };
  
  // Clear auth error
  const clearAuthError = () => {
    setAuthError(null);
  };
  
  // Get JWT token from session
  const getToken = () => {
    return session?.access_token || null;
  };
  
  // The value provided to consumers of this context
  const value = {
    user,
    session,
    loading,
    authError,
    signInWithProvider,
    signOut,
    clearAuthError,
    getToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;