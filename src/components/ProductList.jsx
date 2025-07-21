import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';
import ProductImageUpload from './ProductImageUpload';
import ProductVariant from './ProductVariant';
import ProductDetail from './ProductDetail';
import ProductForm from './ProductForm';
import CategoryManager from './CategoryManager';

const tableVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Modal background overlay
const Backdrop = ({ children, onClick }) => (
  <motion.div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center overflow-y-auto p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

const ProductList = ({ onProductAdded }) => {
  const { formatCurrency } = useCurrency();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [attributeFilter, setAttributeFilter] = useState('');
  const [attributeValueFilter, setAttributeValueFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // For showing product detail modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id, url, is_primary
          ),
          product_variants (
            id, attribute_name, value, price_adjustment, stock, sku
          )
        `);
      if (error) throw error;
      setProducts(data);
      
      // Fetch categories from localStorage
      try {
        const savedCategories = localStorage.getItem('productCategories');
        if (savedCategories) {
          const parsedCategories = JSON.parse(savedCategories);
          setCategories(parsedCategories);
        } else {
          // If no categories in localStorage, extract unique categories from products
          // and create initial category set
          const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
          const formattedCategories = uniqueCategories.map(name => ({ 
            id: name, 
            name: name 
          }));
          
          // Add default categories if none exist
          const categoriesToSave = formattedCategories.length > 0 ? 
            formattedCategories : 
            [
              { id: 'electronics', name: 'Electronics' },
              { id: 'clothing', name: 'Clothing' },
              { id: 'food', name: 'Food' },
              { id: 'furniture', name: 'Furniture' },
              { id: 'other', name: 'Other' }
            ];
            
          setCategories(categoriesToSave);
          localStorage.setItem('productCategories', JSON.stringify(categoriesToSave));
        }
      } catch (err) {
        console.error('Error processing categories:', err);
        // Fallback to extracted categories from products
        const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories.map(name => ({ name, id: name })));
      }
      
      // Extract unique attributes from variants
      const allAttributes = new Set();
      data.forEach(product => {
        if (product.product_variants && product.product_variants.length > 0) {
          product.product_variants.forEach(variant => {
            if (variant.attribute_name) {
              allAttributes.add(variant.attribute_name);
            }
          });
        }
      });
      setAttributes([...allAttributes]);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!categoryFilter || product.category === categoryFilter || 
       (categories.find(c => c.id === categoryFilter)?.name === product.category)) &&
      (!attributeFilter || (
        product.product_variants && 
        product.product_variants.some(v => 
          v.attribute_name === attributeFilter && 
          (!attributeValueFilter || v.value === attributeValueFilter)
        )
      ))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' 
        ? aValue - bValue
        : bValue - aValue;
    });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <motion.div
        className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
  if (error) return (
    <motion.div className="bg-red-50 border border-red-200 rounded-md p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <p className="text-red-600">Error: {error}</p>
    </motion.div>
  );

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mr-4">Product List</h2>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center transition-colors"
                onClick={() => setShowAddProductModal(true)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Product
              </motion.button>
              <div className="relative group">
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="p-2 border border-slate-200 bg-white text-green-700 rounded-md hover:bg-green-50 hover:border-green-400 flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
                  title="Edit Categories"
                  style={{ minWidth: 0, height: '40px' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v4a2 2 0 002 2h2m4 0h2a2 2 0 002-2V7m-6 4V7m0 0V5a2 2 0 012-2h0a2 2 0 012 2v2" />
                  </svg>
                </button>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-slate-800 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity duration-200">Edit Categories</span>
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search products..."
            className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Filter by Category
            </label>
            <div className="flex gap-2">
              <select
                id="category-filter"
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id || category} value={category.id || category}>
                    {category.name || category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Attribute Filter */}
          <div>
            <label htmlFor="attribute-filter" className="block text-sm font-medium text-slate-700 mb-1">
              Filter by Attribute
            </label>
            <select
              id="attribute-filter"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              value={attributeFilter}
              onChange={(e) => {
                setAttributeFilter(e.target.value);
                setAttributeValueFilter(''); // Reset value filter when attribute changes
              }}
            >
              <option value="">All Attributes</option>
              {attributes.map(attr => (
                <option key={attr} value={attr}>{attr}</option>
              ))}
            </select>
          </div>
          
          {/* Attribute Value Filter */}
          {attributeFilter && (
            <div>
              <label htmlFor="attribute-value-filter" className="block text-sm font-medium text-slate-700 mb-1">
                Filter by {attributeFilter} Value
              </label>
              <select
                id="attribute-value-filter"
                className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                value={attributeValueFilter}
                onChange={(e) => setAttributeValueFilter(e.target.value)}
              >
                <option value="">All Values</option>
                {[...new Set(
                  products
                    .flatMap(p => p.product_variants || [])
                    .filter(v => v.attribute_name === attributeFilter)
                    .map(v => v.value)
                )].map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {filteredAndSortedProducts.length === 0 ? (
          <motion.p
            className="text-slate-500 text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >No products found.</motion.p>
        ) : (
          <motion.div
            className="overflow-x-auto"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    { label: 'Image', field: null },
                    { label: 'Name', field: 'name' },
                    { label: 'SKU', field: 'sku' },
                    { label: 'Category', field: 'category' },
                    { label: 'Price', field: 'price' },
                    { label: 'Quantity', field: 'quantity' },
                    { label: 'Variants', field: null },
                    { label: 'Status', field: null },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none ${col.field ? 'hover:text-blue-600 transition-colors cursor-pointer' : ''}`}
                      onClick={col.field ? () => handleSort(col.field) : undefined}
                    >
                      {col.label} {col.field && sortField === col.field && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                className="bg-white divide-y divide-slate-100"
                variants={tableVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredAndSortedProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    variants={rowVariants}
                    whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                    className="transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.product_images && product.product_images.length > 0 ? (
                        <motion.div 
                          className="w-16 h-16 relative rounded-md overflow-hidden border border-slate-200 cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedProduct(product.id)}
                        >
                          <img
                            src={product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                          />
                          {product.product_images.length > 1 && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-tl-md">
                              +{product.product_images.length - 1}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <div 
                          className="w-16 h-16 bg-slate-100 flex items-center justify-center rounded-md cursor-pointer"
                          onClick={() => setSelectedProduct(product.id)}
                        >
                          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="text-sm font-medium text-slate-900 cursor-pointer hover:text-blue-600"
                        onClick={() => setSelectedProduct(product.id)}
                      >
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-xs text-slate-400 mt-1 line-clamp-1">{product.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {product.category ? (
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium">{product.category}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatCurrency(product.price || 0)}
                      {product.product_variants?.some(v => v.price_adjustment !== 0) && (
                        <span className="text-xs text-slate-400 ml-1">+</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {product.quantity}
                      {product.product_variants?.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          {product.product_variants.reduce((sum, v) => sum + (v.stock || 0), 0)} in variants
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {product.product_variants && product.product_variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(product.product_variants.map(v => v.attribute_name))).map(attr => (
                            <div key={attr} className="flex items-center">
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                {attr} ({product.product_variants.filter(v => v.attribute_name === attr).length})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No variants</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.quantity <= (product.reorder_level || 0)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {product.quantity <= (product.reorder_level || 0) ? 'Low Stock' : 'In Stock'}
                      </motion.span>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductDetail 
            productId={selectedProduct} 
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddProductModal && (
          <Backdrop onClick={(e) => e.target === e.currentTarget && setShowAddProductModal(false)}>
            <motion.div
              className="w-full max-w-4xl z-50"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  onClick={() => setShowAddProductModal(false)}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <ProductForm 
                  onProductAdded={() => {
                    fetchProducts();
                    if (onProductAdded) onProductAdded();
                    setShowAddProductModal(false);
                  }} 
                />
              </div>
            </motion.div>
          </Backdrop>
        )}
      </AnimatePresence>

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesChange={fetchProducts}
      />
    </motion.div>
  );
};

export default ProductList;