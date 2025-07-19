import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import format from 'date-fns/format';
import QuantityUpdate from './QuantityUpdate';

const ProductDetail = ({ productId, onClose }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [stockHistory, setStockHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showQuantityUpdate, setShowQuantityUpdate] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
    // Add Escape key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [productId, onClose]);

  const fetchProductDetails = async () => {
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
            id, attribute_name, value, sku, price_adjustment, stock
          ),
          suppliers:supplier_id (
            id, name, email, phone
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    if (activeTab !== 'history' || loadingHistory) return;
    
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setStockHistory(data || []);
    } catch (err) {
      console.error('Error fetching stock history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchStockHistory();
    }
  }, [activeTab]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString || '-';
    }
  };

  const getPrimaryImage = () => {
    if (!product?.product_images || product.product_images.length === 0) {
      return null;
    }
    
    const primaryImage = product.product_images.find(img => img.is_primary);
    return primaryImage || product.product_images[0];
  };

  const getMovementTypeColor = (type) => {
    switch (type) {
      case 'incoming': return 'bg-green-100 text-green-700';
      case 'outgoing': return 'bg-red-100 text-red-700';
      case 'adjustment': return 'bg-yellow-100 text-yellow-700';
      case 'transfer': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleQuantityUpdate = async (newQuantity) => {
    // Update the product in the state
    setProduct({
      ...product,
      quantity: newQuantity
    });
    
    // Refresh the stock history if that tab is active
    if (activeTab === 'history') {
      fetchStockHistory();
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto flex items-center justify-center h-64">
          <motion.div
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800">Error</h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-red-600">Failed to load product details: {error}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Product Details</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {product && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('details')}
              >
                Details
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'variants' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('variants')}
              >
                Variants ({product.product_variants?.length || 0})
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'images' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('images')}
              >
                Images ({product.product_images?.length || 0})
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                onClick={() => setActiveTab('history')}
              >
                Stock History
              </button>
            </div>
            
            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <div className="mb-6">
                    {getPrimaryImage() ? (
                      <img
                        src={getPrimaryImage().url}
                        alt={product.name}
                        className="w-full h-64 object-contain rounded-md border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-64 bg-slate-100 flex items-center justify-center rounded-md border border-slate-200">
                        <svg className="w-12 h-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-700 mb-2">Status Information</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-slate-500">Stock Status</div>
                      <div className="text-sm font-medium">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.quantity <= (product.reorder_level || 0)
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {product.quantity <= (product.reorder_level || 0) ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-500">Current Stock</div>
                      <div className="text-sm font-medium flex items-center">
                        {product.quantity}
                        <button 
                          onClick={() => setShowQuantityUpdate(true)} 
                          className="ml-2 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                          title="Update quantity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="text-sm text-slate-500">Reorder Level</div>
                      <div className="text-sm font-medium">{product.reorder_level || 'Not set'}</div>
                      
                      {product.is_perishable && (
                        <>
                          <div className="text-sm text-slate-500">Perishable</div>
                          <div className="text-sm font-medium text-orange-600">Yes</div>
                        </>
                      )}
                      
                      {product.has_expiry && (
                        <>
                          <div className="text-sm text-slate-500">Has Expiry</div>
                          <div className="text-sm font-medium text-orange-600">Yes</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-1">{product.name}</h1>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-slate-500 text-sm">SKU: {product.sku}</span>
                    {product.category && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{product.category}</span>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Price</h3>
                    <p className="text-2xl font-bold text-blue-600">${parseFloat(product.price).toFixed(2)}</p>
                    {typeof product.purchase_price !== 'undefined' && (
                      <p className="text-sm text-blue-500 mt-1">Purchase Price: ${parseFloat(product.purchase_price).toFixed(2)}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Description</h3>
                    <p className="text-slate-600">{product.description || 'No description available.'}</p>
                  </div>
                  
                  {product.suppliers && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-700 mb-1">Supplier</h3>
                      <div className="p-3 border border-slate-200 rounded-md">
                        <p className="font-medium">{product.suppliers.name}</p>
                        {product.suppliers.email && (
                          <p className="text-sm text-slate-500">{product.suppliers.email}</p>
                        )}
                        {product.suppliers.phone && (
                          <p className="text-sm text-slate-500">{product.suppliers.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">Timestamps</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm text-slate-500">Created</div>
                      <div className="text-sm">{formatDate(product.created_at)}</div>
                      <div className="text-sm text-slate-500">Last Updated</div>
                      <div className="text-sm">{formatDate(product.updated_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div>
                {product.product_variants && product.product_variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Attribute</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">SKU</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Price Adjustment</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {product.product_variants.map(variant => (
                          <tr key={variant.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{variant.attribute_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{variant.value}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{variant.sku || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              {variant.price_adjustment > 0 ? `+$${variant.price_adjustment.toFixed(2)}` : 
                               variant.price_adjustment < 0 ? `-$${Math.abs(variant.price_adjustment).toFixed(2)}` : 
                               '$0.00'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{variant.stock || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">This product has no variants.</p>
                )}
              </div>
            )}
            
            {/* Images Tab */}
            {activeTab === 'images' && (
              <div>
                {product.product_images && product.product_images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.product_images.map(image => (
                      <div key={image.id} className="relative group">
                        <div className={`aspect-square rounded-lg overflow-hidden border ${image.is_primary ? 'border-blue-500' : 'border-slate-200'}`}>
                          <img
                            src={image.url}
                            alt={`Product image for ${product.name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/300?text=Error+Loading+Image';
                            }}
                          />
                        </div>
                        {image.is_primary && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">This product has no images.</p>
                )}
              </div>
            )}
            
            {/* Stock History Tab */}
            {activeTab === 'history' && (
              <div>
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <motion.div
                      className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                ) : stockHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Reference</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {stockHistory.map(movement => (
                          <tr key={movement.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(movement.created_at)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                                {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{movement.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{movement.reference_number || '-'}</td>
                            <td className="px-6 py-4 text-sm text-slate-500">{movement.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-8">No stock movement history available for this product.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Quantity Update Modal */}
      <AnimatePresence>
        {showQuantityUpdate && product && (
          <QuantityUpdate
            productId={product.id}
            currentQuantity={product.quantity}
            onUpdate={handleQuantityUpdate}
            onClose={() => setShowQuantityUpdate(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductDetail;
