import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWarehouseInventory, getWarehouseStockMovements } from '../utils/warehouseUtils';

const WarehouseInventoryView = ({ warehouse, onClose }) => {
  const [inventory, setInventory] = useState(null);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    if (warehouse) {
      fetchWarehouseInventory();
    }
  }, [warehouse]);

  useEffect(() => {
    if (warehouse && activeTab === 'movements') {
      fetchStockMovements();
    }
  }, [warehouse, activeTab]);

  const fetchWarehouseInventory = async () => {
    try {
      setLoading(true);
      const result = await getWarehouseInventory(warehouse.id);
      
      if (result.error) throw result.error;
      
      setInventory(result);
    } catch (err) {
      console.error('Error fetching warehouse inventory:', err);
      setError('Failed to fetch inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const { data, error } = await getWarehouseStockMovements(warehouse.id, { limit: 50 });
      
      if (error) throw error;
      
      setStockMovements(data || []);
    } catch (err) {
      console.error('Error fetching stock movements:', err);
      setError('Failed to fetch stock movement history.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'incoming': return 'bg-green-100 text-green-800';
      case 'outgoing': return 'bg-red-100 text-red-800';
      case 'adjustment': return 'bg-yellow-100 text-yellow-800';
      case 'transfer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:align-middle"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {warehouse.name} - Inventory
                  </h3>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mt-4">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`border-transparent ${
                        activeTab === 'summary'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`border-transparent ${
                        activeTab === 'products'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Products
                    </button>
                    <button
                      onClick={() => setActiveTab('variants')}
                      className={`border-transparent ${
                        activeTab === 'variants'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Variants
                    </button>
                    <button
                      onClick={() => setActiveTab('movements')}
                      className={`border-transparent ${
                        activeTab === 'movements'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Stock Movements
                    </button>
                  </nav>
                </div>

                {/* Content */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 my-4">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                  </div>
                ) : inventory ? (
                  <div className="mt-6">
                    {/* Summary Tab */}
                    {activeTab === 'summary' && (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-800">Total Products</h4>
                            <p className="text-2xl font-semibold text-blue-900">{inventory.summary.totalProducts}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-green-800">Total Variants</h4>
                            <p className="text-2xl font-semibold text-green-900">{inventory.summary.totalVariants}</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-purple-800">Total Stock</h4>
                            <p className="text-2xl font-semibold text-purple-900">{inventory.summary.totalStock}</p>
                          </div>
                        </div>

                        <h4 className="text-lg font-medium mb-3">Category Breakdown</h4>
                        <div className="bg-white shadow overflow-hidden rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {Object.entries(inventory.categories).map(([category, data]) => (
                              <li key={category} className="px-6 py-4 flex items-center justify-between">
                                <div className="font-medium text-gray-900">{category}</div>
                                <div className="text-sm">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    {data.count} Products
                                  </span>
                                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    {data.stock} Units
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Products Tab */}
                    {activeTab === 'products' && (
                      <div className="mt-4 bg-white shadow overflow-hidden rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.products.length > 0 ? (
                              inventory.products.map((product) => (
                                <tr key={product.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{product.sku}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{product.category || 'Uncategorized'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{product.quantity}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      product.quantity <= 0
                                        ? 'bg-red-100 text-red-800'
                                        : product.quantity <= (product.reorder_level || 5)
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {product.quantity <= 0
                                        ? 'Out of Stock'
                                        : product.quantity <= (product.reorder_level || 5)
                                        ? 'Low Stock'
                                        : 'In Stock'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                  No products in this warehouse.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Variants Tab */}
                    {activeTab === 'variants' && (
                      <div className="mt-4 bg-white shadow overflow-hidden rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variant
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.variants.length > 0 ? (
                              inventory.variants.map((variant) => (
                                <tr key={variant.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {variant.products?.name || 'Unknown Product'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {variant.attribute_name}: {variant.value}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{variant.sku}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{variant.stock}</div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                  No variants in this warehouse.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Stock Movements Tab */}
                    {activeTab === 'movements' && (
                      <div className="mt-4 bg-white shadow overflow-hidden rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                From/To
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {stockMovements.length > 0 ? (
                              stockMovements.map((movement) => (
                                <tr key={movement.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {formatDate(movement.created_at)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {movement.products?.name || 'Unknown Product'}
                                    </div>
                                    {movement.variants && (
                                      <div className="text-xs text-gray-500">
                                        {movement.variants.attribute_name}: {movement.variants.value}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span 
                                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        getMovementTypeColor(movement.movement_type)
                                      }`}
                                    >
                                      {movement.movement_type}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {movement.quantity}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {movement.movement_type === 'transfer' && (
                                        <>
                                          {movement.source_warehouse?.name === warehouse.name
                                            ? `To: ${movement.target_warehouse?.name || 'Unknown'}`
                                            : `From: ${movement.source_warehouse?.name || 'Unknown'}`
                                          }
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                  No stock movements recorded for this warehouse.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">No inventory data available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WarehouseInventoryView;
