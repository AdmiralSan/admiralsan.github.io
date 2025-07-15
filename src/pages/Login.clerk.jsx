import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const { isSignedIn } = useUser();

  // If user is already signed in, redirect to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            Welcome to VsdvBillsoft
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-2 text-gray-600 dark:text-gray-300"
          >
            Your comprehensive inventory management solution
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex justify-center"
        >
          <SignIn
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200",
                card: "bg-white dark:bg-gray-800 shadow-xl rounded-xl border-0",
                headerTitle: "text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-600 dark:text-gray-300",
                socialButtonsBlockButton: 
                  "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200",
                socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-200",
                formFieldLabel: "text-gray-700 dark:text-gray-200",
                formFieldInput: 
                  "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400",
                footerActionText: "text-gray-600 dark:text-gray-300",
                footerActionLink: "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300",
              },
            }}
            redirectUrl="/dashboard"
            signUpUrl="/register"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
