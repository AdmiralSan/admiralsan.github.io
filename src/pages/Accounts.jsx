import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { usePermissions } from '../contexts/PermissionsContext';
import { PERMISSIONS } from '../utils/permissions';
import { useCurrency } from '../contexts/CurrencyContext';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';
import { dashboardAPI } from '../utils/accountsAPI';
import CategoryManager from '../components/CategoryManager';

const AccountsNavigation = () => {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  
  const accountsNavLinks = [
    { 
      name: 'Overview', 
      href: '/accounts/overview', 
      icon: '📊',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Daily Ledger', 
      href: '/accounts/daily-ledger', 
      icon: '📋',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Payments', 
      href: '/accounts/payments', 
      icon: '💰',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Pending', 
      href: '/accounts/pending', 
      icon: '⏳',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Expenses', 
      href: '/accounts/expenses', 
      icon: '💸',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Reports', 
      href: '/accounts/reports', 
      icon: '📈',
      permission: PERMISSIONS.reports.view 
    },
    { 
      name: 'Billing', 
      href: '/billing', 
      icon: '🧾',
      permission: PERMISSIONS.billing.view 
    },
    { 
      name: 'Settings', 
      href: '/accounts/settings', 
      icon: '⚙️',
      permission: PERMISSIONS.settings.view 
    }
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {accountsNavLinks.map((link) => (
          hasPermission(link.permission) && (
            <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <span className="mr-2">{link.icon}</span>
              {link.name}
            </NavLink>
          )
        ))}
      </div>
    </nav>
  );
};

const AccountsLayout = () => {
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { formatCurrency } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [billingSummary, setBillingSummary] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    fetchBillingSummary();
  }, []);
  
  const fetchBillingSummary = async () => {
    try {
      const summary = await billingAccountsIntegration.getBillingAccountSummary();
      setBillingSummary(summary);
    } catch (error) {
      console.error('Error fetching billing summary:', error);
    }
  };

  // Check if user has permission to view accounts
  if (!hasPermission(PERMISSIONS.billing.view)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          You don't have permission to view accounts information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Accounts Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your financial accounts and daily transactions
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              fetchBillingSummary();
            }}
            className="btn-secondary bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors flex items-center"
            disabled={loading}
          >
            <span className={`mr-1 ${loading ? 'animate-spin' : ''}`}>⟳</span>
            Refresh
          </button>
          <button
            onClick={() => setShowCategoryManager(true)}
            className="btn-secondary bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-1">🏷️</span>
            Edit Categories
          </button>
          <button className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            New Transaction
          </button>
        </div>
      </motion.div>

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesChange={() => {}}
      />
      {/* Navigation */}
      <AccountsNavigation />

      {/* Main Content */}
      <div className="min-h-96">
        <Outlet />
      </div>
    </div>
  );
};

export default AccountsLayout;
