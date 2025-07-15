import React from 'react';

// Simplified ProtectedRoute that doesn't check for authentication
const ProtectedRoute = ({ children }) => {
  // Always render the protected component (no login required)
  return children;
};

export default ProtectedRoute;