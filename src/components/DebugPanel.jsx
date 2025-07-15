import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { usePermissions } from '../contexts/PermissionsContext';
import { PERMISSIONS } from '../utils/permissions';

const DebugPanel = () => {
  const { user, isSignedIn } = useUser();
  const { organization, membership } = useOrganization();
  const { userRole, hasPermission, loading } = usePermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isSignedIn) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 max-w-sm shadow-lg z-50"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-red-800">Debug: Not Signed In</h3>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▲' : '▼'}
          </button>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-red-600">Please sign in to see permissions</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-4 max-w-sm shadow-lg z-50"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-blue-800">🔍 Debug Panel (Clerk)</h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '▲' : '▼'}
        </button>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 text-sm">
              <div>
                <strong>User:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'Unknown'}
              </div>
              
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              
              <div>
                <strong>Detected Role:</strong> {userRole || 'None'}
              </div>
              
              <div className="border-t pt-2 mt-2">
                <strong>Clerk Data:</strong>
                <div>Public Role: {user?.publicMetadata?.role || 'None'}</div>
                <div>Private Role: {user?.privateMetadata?.role || 'None'}</div>
                <div>Org Role: {membership?.role || 'No org'}</div>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <strong>Key Permissions:</strong>
                <ul className="mt-1 space-y-1">
                  <li>Users View: {hasPermission(PERMISSIONS.users.view) ? '✅' : '❌'}</li>
                  <li>Dashboard: {hasPermission(PERMISSIONS.dashboard.view) ? '✅' : '❌'}</li>
                  <li>Products: {hasPermission(PERMISSIONS.products.view) ? '✅' : '❌'}</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DebugPanel;
