import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg text-center"
      >
        <div>
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-6 0v4H4v10h16V11h-2zM7 7a2 2 0 114 0v4H7V7z" 
            />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-md text-slate-600">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            If you believe you should have access to this resource, please contact your administrator.
          </p>
          
          <div className="flex flex-col space-y-3">
            <Link
              to="/dashboard"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
            
            <Link
              to="/login"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in with a different account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Unauthorized;