import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const BatchOperations = ({ onClose, onOperationComplete }) => {
  const [operation, setOperation] = useState('update');
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [updateField, setUpdateField] = useState('category');
  const [updateValue, setUpdateValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setFetchingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setFetchingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Get unique categories from products
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);
      
      if (error) throw error;
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      // Select all filtered products
      setSelectedProducts(filteredProducts.map(p => p.id));
    } else {
      // Deselect all
      setSelectedProducts([]);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      setError("Please select at least one product.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (operation === 'update') {
        // Batch update products
        let updateData = {};
        updateData[updateField] = updateValue;
        
        if (updateField === 'price' || updateField === 'quantity' || updateField === 'reorder_level') {
          updateData[updateField] = parseFloat(updateValue);
        }
        
        const { error } = await supabase
          .from('products')
          .update(updateData)
          .in('id', selectedProducts);
          
        if (error) throw error;
      } 
      else if (operation === 'delete') {
        // Batch delete products
        const { error } = await supabase
          .from('products')
          .delete()
          .in('id', selectedProducts);
          
        if (error) throw error;
      }
      
      setSuccess(true);
      setTimeout(() => {
        if (onOperationComplete) onOperationComplete();
        onClose();
      }, 1500);
      
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filterCategory ? product.category === filterCategory : true;
    return nameMatch && categoryMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Batch Operations
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Operation Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Operation Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="operation"
                    value="update"
                    checked={operation === 'update'}
                    onChange={() => setOperation('update')}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">Update Products</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="operation"
                    value="delete"
                    checked={operation === 'delete'}
                    onChange={() => setOperation('delete')}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">Delete Products</span>
                </label>
              </div>
            </div>

            {/* Update Fields (if update operation) */}
            {operation === 'update' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Field to Update
                  </label>
                  <select
                    value={updateField}
                    onChange={(e) => setUpdateField(e.target.value)}
                    className="w-full rounded-lg border-slate-200"
                  >
                    <option value="category">Category</option>
                    <option value="price">Price</option>
                    <option value="reorder_level">Reorder Level</option>
                    <option value="supplier">Supplier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    New Value
                  </label>
                  {updateField === 'category' ? (
                    <select
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      className="w-full rounded-lg border-slate-200"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={updateField === 'price' ? 'number' : 'text'}
                      step={updateField === 'price' ? '0.01' : undefined}
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      className="w-full rounded-lg border-slate-200"
                      placeholder={`Enter new ${updateField}`}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Filter and Search */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Search Products
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full rounded-lg border-slate-200"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Selection */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Select Products
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-xs text-slate-500">Select All</span>
                </div>
              </div>
              
              {fetchingProducts ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <p className="text-center py-4 text-slate-500">No products found.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 w-12"></th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredProducts.map((product) => (
                        <tr 
                          key={product.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => toggleProductSelection(product.id)}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                            {product.sku}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                            {product.category}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                            ${product.price?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-2">
                {selectedProducts.length} products selected
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                className={operation === 'delete' ? 'btn-danger' : 'btn-primary'}
                whileTap={{ scale: 0.97 }}
                disabled={loading || selectedProducts.length === 0}
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : success ? (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete
                  </span>
                ) : operation === 'update' ? (
                  `Update ${selectedProducts.length} Products`
                ) : (
                  `Delete ${selectedProducts.length} Products`
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BatchOperations;
