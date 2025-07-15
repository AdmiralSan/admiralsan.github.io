import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import { supabase } from '../../supabaseClient';
import { paymentsAPI } from '../../utils/accountsAPI';
import { billingAccountsIntegration } from '../../utils/billingAccountsIntegration';
import { getSuppliers } from '../../utils/supplierUtils';

const PaymentsPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]); // Only real payments from API
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [billingSummary, setBillingSummary] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [newPayment, setNewPayment] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'received',
    amount: '',
    customer_vendor_name: '',
    reference_number: '',
    payment_method: 'cash',
    payment_status: 'completed',
    notes: '',
    due_date: ''
  });

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mobile_payment', label: 'Mobile Payment' }
  ];

  const paymentStatuses = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    fetchPayments();
    fetchBillingSummary();
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await getSuppliers({ activeOnly: true });
      setSuppliers(data || []);
    } catch (error) {
      setSuppliers([]);
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchBillingSummary = async () => {
    try {
      const summary = await billingAccountsIntegration.getBillingAccountSummary();
      setBillingSummary(summary);
    } catch (error) {
      console.error('Error fetching billing summary:', error);
    }
  };

  useEffect(() => {
    filterPayments();
  }, [payments, filter, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Fetch only real payments data from API
      const paymentsData = await paymentsAPI.getPayments();
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = payments;
    if (filter === 'received' || filter === 'sent') {
      filtered = filtered.filter(payment => payment.payment_type === filter);
    } else if (filter === 'to_suppliers') {
      // Only payments sent to suppliers
      const supplierNames = suppliers.map(s => s.name?.toLowerCase());
      filtered = filtered.filter(payment =>
        payment.payment_type === 'sent' &&
        supplierNames.includes(payment.customer_vendor_name?.toLowerCase())
      );
    }
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customer_vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
    setFilteredPayments(filtered);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    try {
      // Create payment using API
      const paymentData = await paymentsAPI.createPayment({
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      });
      
      setPayments([paymentData, ...payments]);
      
      // Reset form
      setNewPayment({
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'received',
        amount: '',
        customer_vendor_name: '',
        reference_number: '',
        payment_method: 'cash',
        payment_status: 'completed',
        notes: '',
        due_date: ''
      });
      
      setShowAddPaymentModal(false);
      
    } catch (error) {
      console.error('Error adding payment:', error);
    }
  };

  const getPaymentTotals = () => {
    const received = filteredPayments
      .filter(p => p.payment_type === 'received')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const sent = filteredPayments
      .filter(p => p.payment_type === 'sent')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    return { received, sent, net: received - sent };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return '💰';
      case 'check':
        return '📝';
      case 'bank_transfer':
        return '🏦';
      case 'credit_card':
        return '💳';
      case 'mobile_payment':
        return '📱';
      default:
        return '💸';
    }
  };

  const totals = getPaymentTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payments Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track all incoming and outgoing payments
          </p>
        </div>
        <button
          onClick={() => setShowAddPaymentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Payment
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Payments Received</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.received)}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Payments Sent</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.sent)}
              </p>
            </div>
            <div className="text-3xl">📉</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${
                totals.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Payments</option>
              <option value="received">Received</option>
              <option value="sent">Sent</option>
              <option value="to_suppliers">Payments to Suppliers</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Payments List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment History
        </h3>

        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No payments found. Add your first payment to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Customer/Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Method</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        payment.type === 'received' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {payment.type === 'received' ? 'RECEIVED' : 'SENT'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{payment.customerName}</p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{payment.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        payment.type === 'received' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'received' ? '+' : '-'}{formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getMethodIcon(payment.method)}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {(payment.method || '').replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {(payment.status || '').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {payment.reference || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-700 text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-700 text-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-90vh overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Payment
            </h3>
            
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newPayment.date}
                    onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({...newPayment, type: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="received">Received</option>
                    <option value="sent">Sent</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer/Vendor Name
                </label>
                <input
                  type="text"
                  value={newPayment.customer_vendor_name}
                  onChange={(e) => setNewPayment({...newPayment, customer_vendor_name: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter name..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Method
                  </label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({...newPayment, method: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({...newPayment, status: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {paymentStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={newPayment.reference_number}
                  onChange={(e) => setNewPayment({...newPayment, reference_number: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Invoice #, PO #, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <p className="text-gray-900 dark:text-white">{new Date(selectedPayment.date).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  selectedPayment.type === 'received' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {selectedPayment.type === 'received' ? 'RECEIVED' : 'SENT'}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer/Vendor</label>
                <p className="text-gray-900 dark:text-white">{selectedPayment.customerName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <p className={`text-lg font-semibold ${
                  selectedPayment.type === 'received' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedPayment.type === 'received' ? '+' : '-'}{formatCurrency(selectedPayment.amount)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Method</label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getMethodIcon(selectedPayment.method)}</span>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {(selectedPayment.method || '').replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedPayment.status)}`}>
                  {(selectedPayment.status || '').toUpperCase()}
                </span>
              </div>
              
              {selectedPayment.reference && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
                  <p className="text-gray-900 dark:text-white">{selectedPayment.reference}</p>
                </div>
              )}
              
              {selectedPayment.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <p className="text-gray-900 dark:text-white">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Edit Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
