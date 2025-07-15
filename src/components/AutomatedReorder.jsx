import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const AutomatedReorder = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [generatingOrders, setGeneratingOrders] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  useEffect(() => {
    fetchLowStockProducts();
    fetchSuppliers();
    fetchPurchaseOrders();
  }, []);

  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);

      // Get products where quantity is less than or equal to reorder level
      const { data, error } = await supabase
        .from('products')
        .select('*, suppliers(name)')
        .lte('quantity', 0);

      if (error) throw error;

      // Sort by most critical (largest gap between current and reorder)
      const sortedProducts = (data || []).sort((a, b) => {
        const aGap = (a.reorder_level || 0) - (a.quantity || 0);
        const bGap = (b.reorder_level || 0) - (b.quantity || 0);
        return bGap - aGap;
      });

      setProducts(sortedProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    }
  };

  const generatePurchaseOrders = async () => {
    try {
      setGeneratingOrders(true);
      setError(null);
      
      // Group products by supplier
      const supplierGroups = {};
      
      products.forEach(product => {
        const supplierId = product.supplier_id;
        if (!supplierId) return;
        
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push(product);
      });
      
      // Create purchase orders for each supplier
      const poPromises = Object.entries(supplierGroups).map(async ([supplierId, supplierProducts]) => {
        // Create the purchase order
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .insert({
            supplier_id: supplierId,
            status: 'pending',
            total_amount: supplierProducts.reduce(
              (sum, product) => sum + (product.price || 0) * Math.max(product.reorder_level - product.quantity, 0),
              0
            ),
            notes: `Automated reorder for ${supplierProducts.length} products`
          })
          .select();
          
        if (poError) throw poError;
        
        // Create the order items
        const purchaseOrderId = poData[0].id;
        const orderItems = supplierProducts.map(product => ({
          purchase_order_id: purchaseOrderId,
          product_id: product.id,
          quantity: Math.max((product.reorder_level || 0) - (product.quantity || 0), 0),
          price: product.price || 0
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
          
        if (itemsError) throw itemsError;
        
        return poData[0];
      });
      
      await Promise.all(poPromises);
      
      // Refresh data
      fetchPurchaseOrders();
      setSuccessMessage(`Successfully generated ${Object.keys(supplierGroups).length} purchase orders.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
    } catch (err) {
      setError(`Failed to generate purchase orders: ${err.message}`);
    } finally {
      setGeneratingOrders(false);
    }
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  const getOrderStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Automated Reordering</h1>
        <div className="flex gap-3">
          <button 
            className="btn-secondary"
            onClick={() => setShowOrderHistory(!showOrderHistory)}
          >
            {showOrderHistory ? 'Low Stock Items' : 'Order History'}
          </button>
          {!showOrderHistory && (
            <button 
              className="btn-primary"
              onClick={generatePurchaseOrders}
              disabled={generatingOrders || products.length === 0}
            >
              {generatingOrders ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <svg className="w-5 h-5 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              Generate Purchase Orders
            </button>
          )}
        </div>
      </motion.div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700"
        >
          {successMessage}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {showOrderHistory ? (
          <motion.div
            key="orderHistory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Purchase Order History</h2>
            
            {purchaseOrders.length === 0 ? (
              <p className="text-center py-4 text-slate-500">No purchase orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {purchaseOrders.map((order) => (
                      <motion.tr
                        key={order.id}
                        whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          PO-{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {order.suppliers?.name || 'Unknown Supplier'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatCurrency(order.total_amount || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {order.notes || '-'}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="lowStockItems"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-slate-800 mb-6">Low Stock Items</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">No Low Stock Items</h3>
                <p className="text-slate-500">All your inventory items are at healthy stock levels.</p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Reorder Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Order Qty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {products.map((product) => (
                      <motion.tr 
                        key={product.id}
                        whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                        className="transition-all"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-slate-900">{product.name}</div>
                              <div className="text-xs text-slate-500">{product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {product.quantity || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {product.reorder_level || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {Math.max((product.reorder_level || 0) - (product.quantity || 0), 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {product.suppliers?.name || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatCurrency(product.price * Math.max((product.reorder_level || 0) - (product.quantity || 0), 0))}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutomatedReorder;
