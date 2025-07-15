import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ProductVariant from './ProductVariant';
import ProductImageUpload from './ProductImageUpload';
import BatchOperations from './BatchOperations';
import { recordStockMovement } from '../utils/stockMovementUtil';
import { getWarehouses } from '../utils/warehouseUtils';

const initialForm = {
  name: '',
  sku: '',
  category: '',
  price: '',
  quantity: '',
  description: '',
  supplier_id: '',
  warehouse_id: '',
  reorder_level: '',
  has_expiry: false,
  is_perishable: false,
};

// Categories are now fetched from the database

const ProductForm = ({ onProductAdded }) => {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newProductId, setNewProductId] = useState(null);

  useEffect(() => {
    fetchSuppliers();
    fetchWarehouses();
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      // Load categories from localStorage
      const savedCategories = localStorage.getItem('productCategories');
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } else {
        // Initialize with default categories if none exist
        const defaultCategories = [
          { id: 'electronics', name: 'Electronics' },
          { id: 'clothing', name: 'Clothing' },
          { id: 'food', name: 'Food' },
          { id: 'furniture', name: 'Furniture' },
          { id: 'other', name: 'Other' }
        ];
        setCategories(defaultCategories);
        localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Use default categories as fallback
      setCategories([
        { id: 'electronics', name: 'Electronics' },
        { id: 'clothing', name: 'Clothing' },
        { id: 'food', name: 'Food' },
        { id: 'furniture', name: 'Furniture' },
        { id: 'other', name: 'Other' }
      ]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await getWarehouses({ activeOnly: true });
      
      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            ...formData,
            // Find the category name if we're using the ID
            category: categories.find(c => c.id === formData.category)?.name || formData.category,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity),
            reorder_level: parseInt(formData.reorder_level)
          }
        ])
        .select();

      if (error) throw error;
      
      // Store the new product ID for variants and images
      if (data && data.length > 0) {
        const productId = data[0].id;
        setNewProductId(productId);
        
        // Record initial stock movement
        if (parseInt(formData.quantity) > 0) {
          await recordStockMovement({
            productId: productId,
            quantity: parseInt(formData.quantity),
            movementType: 'incoming',
            notes: 'Initial stock when product was created'
          });
        }
      }
      
      if (onProductAdded) onProductAdded();
      setFormData(initialForm);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1800);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Renders a form field with proper styling
  const renderField = (field) => (
    <div key={field.name} className="relative">
      {field.type === 'select' ? (
        <select
          id={field.name}
          name={field.name}
          className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent rounded-md"
          value={formData[field.name]}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      ) : field.type === 'supplier-select' ? (
        <select
          id={field.name}
          name={field.name}
          className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent rounded-md"
          value={formData[field.name]}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">Select a supplier</option>
          {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
          ))}
        </select>
      ) : field.type === 'warehouse-select' ? (
        <select
          id={field.name}
          name={field.name}
          className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent rounded-md"
          value={formData[field.name]}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">Select a warehouse</option>
          {warehouses.map(warehouse => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
      ) : field.type === 'textarea' ? (
        <textarea
          id={field.name}
          name={field.name}
          rows="3"
          className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent resize-none rounded-md"
          value={formData[field.name]}
          onChange={handleChange}
          required={field.required}
          placeholder=" "
        />
      ) : (
        <input
          id={field.name}
          name={field.name}
          type={field.type}
          step={field.step}
          className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent rounded-md"
          value={formData[field.name]}
          onChange={handleChange}
          required={field.required}
          autoComplete="off"
          placeholder=" "
        />
      )}
      <label
        htmlFor={field.name}
        className="absolute left-3 -top-2.5 text-sm font-medium text-slate-600 bg-white px-1 transition-all"
      >
        {field.label}
      </label>
    </div>
  );

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Add New Product</h2>
        <button
          type="button" 
          className="btn-secondary flex items-center text-sm"
          onClick={() => setShowBatchModal(true)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
          Batch Operations
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Product Information */}
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <h3 className="text-md font-medium text-blue-800 mb-3">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField({ label: 'Product Name', name: 'name', type: 'text', required: true })}
            {renderField({ label: 'SKU', name: 'sku', type: 'text', required: true })}
            {renderField({ label: 'Category', name: 'category', type: 'select', required: true })}
            {renderField({ label: 'Price ($)', name: 'price', type: 'number', step: '0.01', required: true })}
          </div>
        </div>

        {/* Inventory Information */}
        <div className="p-4 bg-green-50 rounded-lg mb-4">
          <h3 className="text-md font-medium text-green-800 mb-3">Inventory Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {renderField({ label: 'Quantity', name: 'quantity', type: 'number', required: true })}
            {renderField({ label: 'Reorder Level', name: 'reorder_level', type: 'number', required: true })}
            {renderField({ label: 'Supplier', name: 'supplier_id', type: 'supplier-select', required: true })}
            {renderField({ label: 'Warehouse', name: 'warehouse_id', type: 'warehouse-select', required: true })}
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="has_expiry"
                checked={formData.has_expiry}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-slate-700 text-sm font-medium">Has Expiry Date</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_perishable"
                checked={formData.is_perishable}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-100"
              />
              <span className="text-slate-700 text-sm font-medium">Is Perishable</span>
            </label>
          </div>
        </div>

        {/* Product Description */}
        <div className="p-4 bg-slate-50 rounded-lg mb-4">
          <h3 className="text-md font-medium text-slate-700 mb-3">Additional Details</h3>
          {renderField({ label: 'Description', name: 'description', type: 'textarea' })}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error: {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 py-3 px-4 rounded-xl text-white text-base font-semibold transition-all shadow-sm disabled:opacity-60"
          whileTap={{ scale: 0.97 }}
          disabled={loading}
        >
          <AnimatePresence mode="wait" initial={false}>
            {loading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              />
            ) : success ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-block w-5 h-5 text-white"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Product
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Additional Options after product is added */}
        {success && newProductId && (
          <div className="flex gap-3 mt-4 justify-center">
            <button
              type="button"
              className="btn-secondary text-sm flex items-center"
              onClick={() => setShowVariantsModal(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Add Variants
            </button>
            <button
              type="button"
              className="btn-secondary text-sm flex items-center"
              onClick={() => setShowImagesModal(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Images
            </button>
          </div>
        )}
      </form>

      {/* Modal for variants */}
      <AnimatePresence>
        {showVariantsModal && newProductId && (
          <ProductVariant 
            productId={newProductId} 
            onClose={() => setShowVariantsModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Modal for images */}
      <AnimatePresence>
        {showImagesModal && newProductId && (
          <ProductImageUpload 
            productId={newProductId}
            onClose={() => setShowImagesModal(false)} 
          />
        )}
      </AnimatePresence>

      {/* Modal for batch operations */}
      <AnimatePresence>
        {showBatchModal && (
          <BatchOperations 
            onClose={() => setShowBatchModal(false)} 
            onOperationComplete={onProductAdded}
          />
        )}
      </AnimatePresence>
      
    </motion.div>
  );
};

export default ProductForm;