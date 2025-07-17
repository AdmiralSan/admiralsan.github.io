import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';
import Modal from './Modal';
import PaymentModal from './PaymentModal';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const PendingInvoiceDetail = ({ invoice, onClose, onPaymentComplete, onEditInvoice }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (invoice && invoice.id) {
      fetchPaymentHistory(invoice.id);
    }
  }, [invoice]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const discountAmount = itemTotal * (item.discount_percent / 100);
      return sum + (itemTotal - discountAmount);
    }, 0);
  };

  const getPendingAmount = () => {
    return invoice.total_amount - (invoice.amount_paid || 0);
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePaymentClick = () => {
    setShowPaymentModal(true);
  };
  
  const handleEditClick = () => {
    // Close the detail modal
    onClose();
    
    // If onEditInvoice prop is provided, use that
    if (onEditInvoice) {
      onEditInvoice(invoice);
    } else {
      // Otherwise navigate to the billing page with the invoice ID
      navigate('/billing', { state: { editInvoiceId: invoice.id } });
    }
  };

  const handlePaymentComplete = async (invoiceId, paymentMethod, amountPaid, paymentStatus) => {
    setShowPaymentModal(false);
    // Refetch invoice details to get updated status
    if (onPaymentComplete) {
      await onPaymentComplete(invoiceId, paymentMethod, amountPaid, paymentStatus);
    }
    // If invoice object is local, update its status for immediate UI feedback
    if (paymentStatus === 'paid' && invoice) {
      invoice.payment_status = 'paid';
      invoice.amount_paid = invoice.total_amount;
    } else if (paymentStatus === 'partial' && invoice) {
      invoice.payment_status = 'partial';
      invoice.amount_paid = (invoice.amount_paid || 0) + amountPaid;
    }
    
    // Refresh payment history after a new payment is made
    fetchPaymentHistory(invoiceId);
  };
  
  // Function to fetch payment history for the invoice
  const fetchPaymentHistory = async (invoiceId) => {
    try {
      setLoading(true);
      // Get payments related to this invoice
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('payment_date', { ascending: false });
        
      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal(invoice.invoice_items || []);
  const pendingAmount = getPendingAmount();

  return (
    <>
      <Modal handleClose={onClose} size="large">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                Invoice #{invoice.invoice_number}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.payment_status)}`}>
                {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Invoice Number:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.payment_method || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Warranty:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.warranty_provided ? 'Yes' : 'No'}</span>
                </div>
                {invoice.notes && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-sm text-gray-900 mt-1">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.customers?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.customers?.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{invoice.customers?.email || 'Not provided'}</span>
                </div>
                {invoice.customers?.address && (
                  <div className="mt-3">
                    <span className="text-sm text-gray-600">Address:</span>
                    <p className="text-sm text-gray-900 mt-1">{invoice.customers.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.invoice_items?.map((item) => {
                    const itemTotal = item.quantity * item.unit_price;
                    const discountAmount = itemTotal * (item.discount_percent / 100);
                    const finalTotal = itemTotal - discountAmount;
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {item.products?.name || 'Unknown Product'}
                          </div>
                          {item.products?.sku && (
                            <div className="text-xs text-gray-500">SKU: {item.products.sku}</div>
                          )}
                          {item.serial_number && (
                            <div className="text-xs text-gray-500">S/N: {item.serial_number}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.product_variants 
                              ? `${item.product_variants.attribute_name}: ${item.product_variants.value}`
                              : 'Base Model'
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.quantity}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.discount_percent}% 
                            {item.discount_percent > 0 && (
                              <span className="text-xs text-gray-500 block">
                                (-{formatCurrency(discountAmount)})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(finalTotal)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              {invoice.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount:</span>
                  <span className="text-sm font-medium text-gray-900">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              {invoice.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="text-base font-semibold text-gray-900">Total Amount:</span>
                <span className="text-base font-semibold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {invoice.amount_paid > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">Amount Paid:</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(invoice.amount_paid)}</span>
                </div>
              )}
              {pendingAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-base font-semibold text-red-600">Pending Amount:</span>
                  <span className="text-base font-semibold text-red-600">{formatCurrency(pendingAmount)}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment History */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
            {loading ? (
              <div className="text-center py-4">
                <p>Loading payment history...</p>
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.payment_method || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.reference || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            payment.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                            payment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.payment_status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No payment records found for this invoice.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            
            <button
              onClick={handleEditClick}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Invoice
            </button>
            
            {pendingAmount > 0 && (
              <button
                onClick={handlePaymentClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Record Payment
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
};

export default PendingInvoiceDetail;
