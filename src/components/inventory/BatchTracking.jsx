import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const BatchTracking = () => {
  const { refreshData } = useOutletContext();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, expired, expiring30, expiring90, valid
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  
  useEffect(() => {
    fetchBatches();
    fetchProducts();
    fetchWarehouses();
  }, []);
  
  const fetchBatches = async () => {
    try {
      setLoading(true);
      
      // Get all batches with joined product and warehouse data
      const { data, error } = await supabase
        .from('product_batches')
        .select(`
          *,
          products (id, name, sku, category),
          warehouses (id, name, location)
        `)
        .order('expiry_date', { ascending: true });
        
      if (error) throw error;
      
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batch data:', err);
      setError('Failed to fetch batch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };
  
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };
  
  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get days until expiry (or days since expiry if negative)
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Get expiry status and styling
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { class: 'bg-gray-100 text-gray-800', text: 'No Expiry' };
    
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
      return { 
        class: 'bg-red-100 text-red-800', 
        text: `Expired ${Math.abs(daysUntilExpiry)} days ago` 
      };
    } else if (daysUntilExpiry <= 30) {
      return { 
        class: 'bg-yellow-100 text-yellow-800', 
        text: `Expires in ${daysUntilExpiry} days` 
      };
    } else if (daysUntilExpiry <= 90) {
      return { 
        class: 'bg-blue-100 text-blue-800', 
        text: `Expires in ${daysUntilExpiry} days` 
      };
    } else {
      return { 
        class: 'bg-green-100 text-green-800', 
        text: `Expires in ${daysUntilExpiry} days` 
      };
    }
  };
  
  // Apply filters
  const filteredBatches = batches.filter(batch => {
    // Text search
    const matchesSearch = 
      batch.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.products?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Product filter
    const matchesProduct = !productFilter || batch.product_id === productFilter;
    
    // Warehouse filter
    const matchesWarehouse = !warehouseFilter || batch.warehouse_id === warehouseFilter;
    
    // Expiry filter
    let matchesExpiry = true;
    const daysUntilExpiry = getDaysUntilExpiry(batch.expiry_date);
    
    if (expiryFilter === 'expired') {
      matchesExpiry = daysUntilExpiry !== null && daysUntilExpiry < 0;
    } else if (expiryFilter === 'expiring30') {
      matchesExpiry = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    } else if (expiryFilter === 'expiring90') {
      matchesExpiry = daysUntilExpiry !== null && daysUntilExpiry > 30 && daysUntilExpiry <= 90;
    } else if (expiryFilter === 'valid') {
      matchesExpiry = daysUntilExpiry === null || daysUntilExpiry > 0;
    }
    
    return matchesSearch && matchesProduct && matchesWarehouse && matchesExpiry;
  });
  
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
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Batch Tracking</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Search Batches
          </label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search by batch number, product..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="product-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Product
          </label>
          <select
            id="product-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="warehouse-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Warehouse
          </label>
          <select
            id="warehouse-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="expiry-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Expiry
          </label>
          <select
            id="expiry-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
          >
            <option value="all">All Batches</option>
            <option value="expired">Expired</option>
            <option value="expiring30">Expiring in 30 days</option>
            <option value="expiring90">Expiring in 90 days</option>
            <option value="valid">Valid (not expired)</option>
          </select>
        </div>
      </div>
      
      {/* Batches Table */}
      {filteredBatches.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No batches found matching your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturing Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map(batch => {
                const expiryStatus = getExpiryStatus(batch.expiry_date);
                
                return (
                  <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.batch_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.products?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-gray-500">{batch.products?.sku || 'No SKU'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{batch.warehouses?.name || 'Unknown Warehouse'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.quantity || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(batch.manufacturing_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(batch.expiry_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${expiryStatus.class}`}>
                        {expiryStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BatchTracking;