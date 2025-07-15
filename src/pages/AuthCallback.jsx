import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';

const AuthCallback = () => {
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('Please wait while we complete the authentication process...');
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // Get the session with JWT token from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.access_token) {
          // We have a valid JWT token
          setMessage('Authentication successful! Redirecting to dashboard...');
          
          // Log the successful authentication (but not the token itself for security)
          console.log('Authentication successful, JWT token received');
          
          // Store JWT in session storage for API calls if needed
          // The Supabase client will handle this automatically, but we confirm it worked
          
          // Successfully signed in, redirect to dashboard
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        } else {
          // No JWT token found, something went wrong
          throw new Error('Authentication failed. No valid token received.');
        }
      } catch (error) {
        console.error('Error during authentication callback:', error);
        setError(error.message);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center"
      >
        {error ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Authentication Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <p className="mt-2 text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h3 className="mt-3 text-lg font-medium text-gray-900">Signing you in</h3>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AuthCallback;