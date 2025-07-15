import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getInventorySummary } from '../utils/inventoryUtils';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringBatchesCount: 0,
    lowStockProducts: [],
    outOfStockProducts: [],
    expiringProducts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { totalProducts, lowStockCount, outOfStockCount, expiringBatchesCount, 
              lowStockProducts, outOfStockProducts, expiringProducts, error } = await getInventorySummary();
      
      if (error) throw error;
      
      setSummaryData({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        expiringBatchesCount,
        lowStockProducts,
        outOfStockProducts,
        expiringProducts
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Inventory Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Summary Cards */}
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-1">Total Products</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-gray-900">{summaryData.totalProducts}</div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-1">Low Stock Items</h3>
          <div className="flex items-center">
            <div className={`text-3xl font-bold ${summaryData.lowStockCount > 0 ? 'text-yellow-500' : 'text-gray-900'}`}>
              {summaryData.lowStockCount}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-1">Out of Stock</h3>
          <div className="flex items-center">
            <div className={`text-3xl font-bold ${summaryData.outOfStockCount > 0 ? 'text-red-500' : 'text-gray-900'}`}>
              {summaryData.outOfStockCount}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white rounded-lg shadow-md p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-gray-500 text-sm font-medium uppercase mb-1">Expiring Soon</h3>
          <div className="flex items-center">
            <div className={`text-3xl font-bold ${summaryData.expiringBatchesCount > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
              {summaryData.expiringBatchesCount}
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Low Stock Alert Section */}
      {summaryData.lowStockProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Low Stock Alerts</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-yellow-500">{product.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.reorder_level}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Expiring Products Section */}
      {summaryData.expiringProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Products Expiring Within 30 Days</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summaryData.expiringProducts.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.products?.name}</div>
                      {batch.variants && (
                        <div className="text-sm text-gray-500">
                          {batch.variants.attribute_name}: {batch.variants.value}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {new Date(batch.expiry_date).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
