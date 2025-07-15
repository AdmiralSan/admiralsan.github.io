import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const ProductVariants = () => {
  const { refreshData } = useOutletContext();
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [attributes, setAttributes] = useState([]);
  const [stockFilter, setStockFilter] = useState('all'); // all, inStock, lowStock, outOfStock
  
  useEffect(() => {
    fetchVariants();
  }, []);
  
  const fetchVariants = async () => {
    try {
      setLoading(true);
      
      // Join product_variants with products to get all the data we need
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          products (id, name, sku, category, reorder_level)
        `);
        
      if (error) throw error;
      
      // Extract unique attributes
      const uniqueAttributes = [...new Set(data.map(variant => variant.attribute_name).filter(Boolean))];
      setAttributes(uniqueAttributes);
      
      setVariants(data);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setError('Failed to fetch variant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Apply filters
  const filteredVariants = variants.filter(variant => {
    // Text search
    const matchesSearch = 
      variant.value?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.products?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Attribute filter
    const matchesAttribute = !attributeFilter || variant.attribute_name === attributeFilter;
    
    // Stock filter
    let matchesStock = true;
    if (stockFilter === 'inStock') {
      matchesStock = variant.stock > 0;
    } else if (stockFilter === 'lowStock') {
      matchesStock = variant.stock > 0 && variant.stock <= (variant.products?.reorder_level || 5);
    } else if (stockFilter === 'outOfStock') {
      matchesStock = variant.stock <= 0;
    }
    
    return matchesSearch && matchesAttribute && matchesStock;
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
      <h2 className="text-xl font-semibold mb-6">Product Variants</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Search Variants
          </label>
          <input
            id="search-filter"
            type="text"
            placeholder="Search by value, SKU, product name..."
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="attribute-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Attribute
          </label>
          <select
            id="attribute-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={attributeFilter}
            onChange={(e) => setAttributeFilter(e.target.value)}
          >
            <option value="">All Attributes</option>
            {attributes.map(attribute => (
              <option key={attribute} value={attribute}>{attribute}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="stock-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Stock
          </label>
          <select
            id="stock-filter"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="all">All Stock Levels</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
      </div>
      
      {/* Variants Table */}
      {filteredVariants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No variants found matching your filters.</p>
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
                  Attribute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Adjustment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVariants.map(variant => {
                const stockStatus = 
                  variant.stock <= 0
                    ? { class: 'bg-red-100 text-red-800', text: 'Out of Stock' }
                    : variant.stock <= (variant.products?.reorder_level || 5)
                    ? { class: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
                    : { class: 'bg-green-100 text-green-800', text: 'In Stock' };
                
                return (
                  <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{variant.products?.name || 'Unknown Product'}</div>
                      <div className="text-xs text-gray-500">{variant.products?.category || 'Uncategorized'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{variant.attribute_name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{variant.value || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{variant.sku || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {variant.price_adjustment ? (
                        <div className={`text-sm ${variant.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variant.price_adjustment >= 0 ? '+' : ''}${variant.price_adjustment.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{variant.stock || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus.class}`}>
                        {stockStatus.text}
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

export default ProductVariants;