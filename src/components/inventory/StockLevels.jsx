import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const StockLevels = () => {
  const { refreshData } = useOutletContext();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, inStock, lowStock, outOfStock
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, []);
  
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, location')
        .order('name');
      
      if (error) {
        console.error('Supabase error fetching warehouses:', error);
        throw error;
      }
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(`Failed to fetch warehouses: ${err.message || 'Please check your connection and try again.'}`);
    }
  };
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products with their warehouse information
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          id, 
          name, 
          sku, 
          category, 
          price, 
          reorder_level, 
          quantity,
          warehouse_id,
          warehouses:warehouse_id (
            id,
            name
          )
        `);
      
      if (productsError) {
        console.error('Supabase error fetching products:', productsError);
        throw productsError;
      }
      
      // Process the data to create warehouse distribution
      const productsWithStock = products.map(product => {
        // Initialize warehouse quantities map
        const warehouseQuantities = {};
        
        // Set the quantity for the warehouse this product belongs to
        if (product.warehouse_id) {
          warehouseQuantities[product.warehouse_id] = product.quantity || 0;
        }
        
        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          price: product.price,
          reorder_level: product.reorder_level,
          totalQuantity: product.quantity || 0,
          warehouseQuantities
        };
      });
      
      setProducts(productsWithStock);
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError(`Failed to fetch stock data: ${err.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters
  const filteredProducts = products.filter(product => {
    // Text search
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Warehouse filter
    const matchesWarehouse = selectedWarehouse === 'all' || 
      (product.warehouseQuantities && product.warehouseQuantities[selectedWarehouse] !== undefined);
    
    // Status filter
    let matchesStatus = true;
    const stockLevel = selectedWarehouse === 'all' 
      ? product.totalQuantity 
      : (product.warehouseQuantities?.[selectedWarehouse] || 0);
    
    if (filterStatus === 'inStock') {
      matchesStatus = stockLevel > 0;
    } else if (filterStatus === 'lowStock') {
      matchesStatus = stockLevel > 0 && stockLevel <= (product.reorder_level || 5);
    } else if (filterStatus === 'outOfStock') {
      matchesStatus = stockLevel <= 0;
    }
    
    return matchesSearch && matchesWarehouse && matchesStatus;
  });
  
  const handleRefresh = () => {
    setError(null);
    fetchWarehouses();
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <motion.div
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex justify-between items-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Stock Levels</h2>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
          disabled={loading}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="warehouse-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Warehouse
          </label>
          <select
            id="warehouse-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="all">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Status
          </label>
          <select
            id="status-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Stock Levels</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Search Products
          </label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search by name, SKU, category..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Stock Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No products found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                {selectedWarehouse === 'all' ? (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                ) : (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity in {warehouses.find(w => w.id === selectedWarehouse)?.name || ''}
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {selectedWarehouse === 'all' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse Distribution
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {products.length === 0 
                          ? "No products are available in your inventory."
                          : "No products match your current filters."
                        }
                      </p>
                      {products.length === 0 && (
                        <div className="mt-4">
                          <button
                            onClick={handleRefresh}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            Refresh Data
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                const stockLevel = selectedWarehouse === 'all' 
                  ? product.totalQuantity 
                  : (product.warehouseQuantities?.[selectedWarehouse] || 0);
                
                const stockStatus = 
                  stockLevel <= 0
                    ? { class: 'bg-red-100 text-red-800', text: 'Out of Stock' }
                    : stockLevel <= (product.reorder_level || 5)
                    ? { class: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
                    : { class: 'bg-green-100 text-green-800', text: 'In Stock' };
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.sku || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.category || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stockLevel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{product.reorder_level || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.class}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    {selectedWarehouse === 'all' && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {warehouses.map(warehouse => {
                            const quantity = product.warehouseQuantities?.[warehouse.id] || 0;
                            if (quantity <= 0) return null;
                            
                            return (
                              <span 
                                key={warehouse.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {warehouse.name}: {quantity}
                              </span>
                            );
                          })}
                          {!Object.keys(product.warehouseQuantities || {}).length && (
                            <span className="text-sm text-gray-500">No warehouse data</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockLevels;