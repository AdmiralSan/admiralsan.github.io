import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  getWarehouses, 
  getWarehouseInventory, 
  transferBetweenWarehouses 
} from '../utils/inventoryUtils';
import { supabase } from '../supabaseClient';

const WarehouseTransfer = ({ onClose, onTransferComplete }) => {
  const [warehouses, setWarehouses] = useState([]);
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [targetWarehouse, setTargetWarehouse] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // When source warehouse changes, fetch its products
  useEffect(() => {
    if (sourceWarehouse) {
      fetchWarehouseProducts(sourceWarehouse);
      setSelectedProduct('');
      setSelectedVariant('');
      setVariants([]);
      setQuantity(1);
    }
  }, [sourceWarehouse]);

  // When product changes, fetch its variants
  useEffect(() => {
    if (selectedProduct) {
      const selectedProductObj = products.find(p => p.id === selectedProduct);
      
      if (selectedProductObj) {
        // Set max quantity for the product
        setMaxQuantity(selectedProductObj.quantity || 0);
        
        // If there are variants, populate them
        if (selectedProductObj.variants && selectedProductObj.variants.length > 0) {
          setVariants(selectedProductObj.variants);
        } else {
          setVariants([]);
        }
        
        setSelectedVariant('');
      }
    } else {
      setMaxQuantity(0);
      setVariants([]);
    }
  }, [selectedProduct, products]);

  // When variant changes, update max quantity
  useEffect(() => {
    if (selectedVariant) {
      const selectedVariantObj = variants.find(v => v.id === selectedVariant);
      
      if (selectedVariantObj) {
        setMaxQuantity(selectedVariantObj.stock || 0);
      }
    } else if (selectedProduct) {
      const selectedProductObj = products.find(p => p.id === selectedProduct);
      
      if (selectedProductObj) {
        setMaxQuantity(selectedProductObj.quantity || 0);
      }
    } else {
      setMaxQuantity(0);
    }
  }, [selectedVariant, variants, selectedProduct, products]);

  // Fetch warehouses from the database
  const fetchWarehouses = async () => {
    try {
      const { data, error } = await getWarehouses({ activeOnly: true });
      
      if (error) throw error;
      
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError('Failed to fetch warehouses. Please try again.');
    }
  };

  // Fetch products for a specific warehouse
  const fetchWarehouseProducts = async (warehouseId) => {
    try {
      setFetchingProducts(true);
      const { products, variants, error } = await getWarehouseInventory(warehouseId);
      
      if (error) throw error;
      
      // Combine products and their variants for easier selection
      const enhancedProducts = products.map(product => ({
        ...product,
        variants: variants.filter(v => v.product_id === product.id)
      }));
      
      setProducts(enhancedProducts.filter(p => p.quantity > 0 || p.variants.some(v => v.stock > 0)));
    } catch (err) {
      console.error('Error fetching warehouse products:', err);
      setError('Failed to fetch products. Please try again.');
    } finally {
      setFetchingProducts(false);
    }
  };

  // Handle transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!sourceWarehouse) throw new Error('Please select a source warehouse');
      if (!targetWarehouse) throw new Error('Please select a target warehouse');
      if (sourceWarehouse === targetWarehouse) throw new Error('Source and target warehouses must be different');
      if (!selectedProduct) throw new Error('Please select a product to transfer');
      if (quantity <= 0) throw new Error('Quantity must be greater than 0');
      if (quantity > maxQuantity) throw new Error(`Cannot transfer more than ${maxQuantity} units`);

      const transferData = {
        productId: selectedProduct,
        variantId: selectedVariant || null,
        quantity: parseInt(quantity),
        sourceWarehouseId: sourceWarehouse,
        targetWarehouseId: targetWarehouse,
        notes: notes || 'Warehouse transfer',
        referenceNumber: `TRANSFER-${Date.now()}`
      };

      const { data, error } = await transferBetweenWarehouses(transferData);
      
      if (error) throw error;
      
      if (data && !data.success) {
        throw new Error(data.message || 'Transfer failed');
      }
      
      setSuccess(true);
      
      // Reset form fields
      setSelectedProduct('');
      setSelectedVariant('');
      setQuantity(1);
      setNotes('');
      
      // Notify parent component
      onTransferComplete && onTransferComplete();
      
      // Close the modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error transferring inventory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
        >
          <form onSubmit={handleTransfer}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Transfer Inventory Between Warehouses
                  </h3>
                  <div className="mt-6 space-y-4">
                    {/* Source Warehouse Selection */}
                    <div>
                      <label htmlFor="sourceWarehouse" className="block text-sm font-medium text-gray-700">
                        From Warehouse *
                      </label>
                      <select
                        id="sourceWarehouse"
                        required
                        value={sourceWarehouse}
                        onChange={(e) => setSourceWarehouse(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select source warehouse</option>
                        {warehouses.map((warehouse) => (
                          <option key={`source-${warehouse.id}`} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Target Warehouse Selection */}
                    <div>
                      <label htmlFor="targetWarehouse" className="block text-sm font-medium text-gray-700">
                        To Warehouse *
                      </label>
                      <select
                        id="targetWarehouse"
                        required
                        value={targetWarehouse}
                        onChange={(e) => setTargetWarehouse(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={!sourceWarehouse}
                      >
                        <option value="">Select target warehouse</option>
                        {warehouses
                          .filter(w => w.id !== sourceWarehouse)
                          .map((warehouse) => (
                            <option key={`target-${warehouse.id}`} value={warehouse.id}>
                              {warehouse.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Product Selection */}
                    <div>
                      <label htmlFor="selectedProduct" className="block text-sm font-medium text-gray-700">
                        Product *
                      </label>
                      <select
                        id="selectedProduct"
                        required
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={!sourceWarehouse || fetchingProducts}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.sku}) - Stock: {product.quantity}
                          </option>
                        ))}
                      </select>
                      {fetchingProducts && (
                        <p className="mt-1 text-xs text-gray-500">Loading products...</p>
                      )}
                    </div>

                    {/* Variant Selection (if available) */}
                    {variants.length > 0 && (
                      <div>
                        <label htmlFor="selectedVariant" className="block text-sm font-medium text-gray-700">
                          Variant (Optional)
                        </label>
                        <select
                          id="selectedVariant"
                          value={selectedVariant}
                          onChange={(e) => setSelectedVariant(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select variant (or leave empty for base product)</option>
                          {variants.map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {variant.attribute_name}: {variant.value} - Stock: {variant.stock}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        min="1"
                        max={maxQuantity}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={!selectedProduct}
                      />
                      {selectedProduct && (
                        <p className="mt-1 text-xs text-gray-500">
                          Maximum available: {maxQuantity}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Add any additional details about this transfer"
                      ></textarea>
                    </div>
                  </div>

                  {/* Error and Success Messages */}
                  {error && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mt-4 rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">Transfer completed successfully!</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading || success}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? 'Processing...' : 'Transfer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WarehouseTransfer;
