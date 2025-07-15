import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInventorySummary } from '../utils/inventoryUtils';

const Inventory = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchInventorySummary();
    
    // If we're on the base inventory path, redirect to overview
    if (location.pathname === '/inventory') {
      navigate('/inventory/overview');
    }
  }, [location.pathname, navigate]);
  
  const fetchInventorySummary = async () => {
    try {
      setLoading(true);
      const result = await getInventorySummary();
      
      if (result.error) throw result.error;
      
      setSummary(result);
    } catch (err) {
      console.error('Error fetching inventory summary:', err);
      setError('Failed to fetch inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a link is active
  const isActive = (path) => {
    return location.pathname.includes(path);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <Link
            to="/inventory/overview"
            className={`${
              isActive('/overview')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </Link>
          <Link
            to="/inventory/products"
            className={`${
              isActive('/products')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Products
          </Link>
          <Link
            to="/inventory/variants"
            className={`${
              isActive('/variants')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Variants
          </Link>
          <Link
            to="/inventory/stock-levels"
            className={`${
              isActive('/stock-levels')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Stock Levels
          </Link>
          <Link
            to="/inventory/batch-tracking"
            className={`${
              isActive('/batch-tracking')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Batch Tracking
          </Link>
          <Link
            to="/inventory/stock-movements"
            className={`${
              isActive('/stock-movements')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Stock Movements
          </Link>
          <Link
            to="/inventory/warehouses"
            className={`${
              isActive('/warehouses')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Warehouses
          </Link>
          <Link
            to="/inventory/suppliers"
            className={`${
              isActive('/suppliers')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Suppliers
          </Link>
          <Link
            to="/inventory/reordering"
            className={`${
              isActive('/reordering')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Reordering
          </Link>
        </nav>
      </div>
      
      {/* Loading State */}
      {loading && !summary && (
        <div className="flex justify-center items-center h-64">
          <motion.div
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Content - Will be replaced by the Outlet */}
      <div className="bg-white rounded-lg shadow p-6">
        <Outlet context={{ summary, loading, refreshData: fetchInventorySummary }} />
      </div>
    </div>
  );
};

export default Inventory;