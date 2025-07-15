import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();
  const location = useLocation();

  // Show loading spinner while Clerk is determining auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // If not signed in, redirect to login page
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If signed in, render the protected component
  return children;
};

export default ProtectedRoute;
