import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { getWarehouses } from '../utils/inventoryUtils';

const ProductVariant = ({ productId, onClose, existingVariants = [] }) => {
  const [variants, setVariants] = useState(existingVariants.length > 0 ? existingVariants : [{ attribute_name: '', value: '', sku: '', price_adjustment: 0, stock: 0, warehouse_id: '' }]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchWarehouses();
  }, []);
  
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await getWarehouses({ activeOnly: true });
      
      if (error) throw error;
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const handleAddVariant = () => {
    setVariants([...variants, { attribute_name: '', value: '', sku: '', price_adjustment: 0, stock: 0, warehouse_id: '' }]);
  };

  const handleRemoveVariant = (index) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Check for duplicates
      const values = variants.map(v => v.value.trim());
      if (new Set(values).size !== values.length) {
        throw new Error('Duplicate variant values detected. Each variant must be unique.');
      }
      
      // First, delete existing variants if updating
      if (existingVariants.length > 0) {
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);
      }
      
      // Insert all variants
      const variantsToInsert = variants.map(variant => ({
        ...variant,
        product_id: productId,
        price_adjustment: parseFloat(variant.price_adjustment) || 0,
        stock: parseInt(variant.stock) || 0
      }));
      
      const { error: insertError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);
        
      if (insertError) throw insertError;
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            {existingVariants.length > 0 ? 'Edit Product Variants' : 'Add Product Variants'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {variants.map((variant, index) => (
              <motion.div
                key={index}
                className="p-4 border border-slate-200 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-slate-700">Variant {index + 1}</h3>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      id={`attribute_name_${index}`}
                      name={`attribute_name_${index}`}
                      type="text"
                      className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
                      value={variant.attribute_name}
                      onChange={(e) => handleVariantChange(index, 'attribute_name', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label
                      htmlFor={`attribute_name_${index}`}
                      className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
                    >
                      Attribute Name (e.g. Size, Color)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id={`value_${index}`}
                      name={`value_${index}`}
                      type="text"
                      className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
                      value={variant.value}
                      onChange={(e) => handleVariantChange(index, 'value', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label
                      htmlFor={`value_${index}`}
                      className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
                    >
                      Value (e.g. Large, Red)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id={`sku_${index}`}
                      name={`sku_${index}`}
                      type="text"
                      className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
                      value={variant.sku}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      placeholder=" "
                    />
                    <label
                      htmlFor={`sku_${index}`}
                      className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
                    >
                      SKU
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id={`price_adjustment_${index}`}
                      name={`price_adjustment_${index}`}
                      type="number"
                      step="0.01"
                      className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
                      value={variant.price_adjustment}
                      onChange={(e) => handleVariantChange(index, 'price_adjustment', e.target.value)}
                      placeholder=" "
                    />
                    <label
                      htmlFor={`price_adjustment_${index}`}
                      className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
                    >
                      Price Adjustment (+/-)
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id={`stock_${index}`}
                      name={`stock_${index}`}
                      type="number"
                      className="peer w-full bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      placeholder=" "
                      required
                    />
                    <label
                      htmlFor={`stock_${index}`}
                      className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
                    >
                      Stock Quantity
                    </label>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Variant
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm mt-2"
              >
                Error: {error}
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
                className="btn-primary"
                whileTap={{ scale: 0.97 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : success ? (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                ) : (
                  'Save Variants'
                )}
              </motion.button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProductVariant;
