import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';

const InventoryOverview = () => {
  const { summary, loading } = useOutletContext();
  
  if (loading) {
    return <p>Loading overview data...</p>;
  }
  
  if (!summary) {
    return <p>No inventory data available.</p>;
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div 
          className="bg-blue-50 p-6 rounded-lg shadow-sm"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-sm font-medium text-blue-800 uppercase">Total Products</h3>
          <p className="text-3xl font-bold text-blue-900">{summary.totalProducts || 0}</p>
          <p className="text-sm text-blue-600 mt-1">Across all warehouses</p>
        </motion.div>
        
        <motion.div 
          className="bg-green-50 p-6 rounded-lg shadow-sm"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-sm font-medium text-green-800 uppercase">Total Stock</h3>
          <p className="text-3xl font-bold text-green-900">{summary.totalStock || 0}</p>
          <p className="text-sm text-green-600 mt-1">Units in inventory</p>
        </motion.div>
        
        <motion.div 
          className="bg-purple-50 p-6 rounded-lg shadow-sm"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <h3 className="text-sm font-medium text-purple-800 uppercase">Inventory Value</h3>
          <p className="text-3xl font-bold text-purple-900">
            ${summary.totalValue ? summary.totalValue.toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-purple-600 mt-1">Total value of inventory</p>
        </motion.div>
      </div>
      
      {/* Warehouse Summary */}
      {summary.warehouses && summary.warehouses.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-3">Warehouse Distribution</h3>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {summary.warehouses.map((warehouse) => (
                <li key={warehouse.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{warehouse.name}</p>
                    <p className="text-sm text-gray-500">{warehouse.location}</p>
                  </div>
                  <div className="text-sm">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                      {warehouse.productCount} Products
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {warehouse.stockCount} Units
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Category Distribution */}
      {summary.categories && Object.keys(summary.categories).length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Category Distribution</h3>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {Object.entries(summary.categories).map(([category, data]) => (
                <li key={category} className="px-6 py-4 flex items-center justify-between">
                  <div className="font-medium text-gray-900">{category || 'Uncategorized'}</div>
                  <div className="text-sm">
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                      {data.count} Products
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                      {data.stock} Units
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      ${data.value ? data.value.toFixed(2) : '0.00'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Low Stock Alerts */}
      {summary.lowStock && summary.lowStock.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">Low Stock Alerts</h3>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              {summary.lowStock.length} products are below their reorder threshold.
            </p>
          </div>
          <div className="bg-white shadow overflow-hidden rounded-md">
            <ul className="divide-y divide-gray-200">
              {summary.lowStock.map((product) => (
                <li key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      Stock: {product.quantity} / {product.reorder_level}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;