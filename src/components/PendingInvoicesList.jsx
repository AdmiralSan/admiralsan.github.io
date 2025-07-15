import React, { useState, useEffect } from 'react';
import pendingInvoicesAPI from '../utils/pendingInvoicesAPI';
import PaymentModal from './PaymentModal-Updated';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';

/**
 * PendingInvoicesList - Component for displaying invoices with pending or partial payment status
 * Allows for completing payments from this view
 */
const PendingInvoicesList = () => {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [totalPendingAmount, setTotalPendingAmount] = useState(0);
  const [counts, setCounts] = useState({ pending: 0, partial: 0, total: 0 });

  // Fetch pending invoices on component mount
  useEffect(() => {
    fetchPendingInvoices();
  }, []);

  // Function to fetch pending invoices data
  const fetchPendingInvoices = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [invoices, totalAmount, invoiceCounts] = await Promise.all([
        pendingInvoicesAPI.getAllPendingInvoices(),
        pendingInvoicesAPI.getTotalPendingAmount(),
        pendingInvoicesAPI.getPendingInvoiceCounts()
      ]);
      
      setPendingInvoices(invoices);
      setTotalPendingAmount(totalAmount);
      setCounts(invoiceCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending invoices:', err);
      setError('Failed to load pending invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle click on payment button
  const handlePaymentClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  // Handle payment completion
  const handlePaymentComplete = async (invoiceId, paymentMethod, amountPaid, paymentStatus) => {
    setShowPaymentModal(false);
    
    // Refresh data after payment is processed
    await fetchPendingInvoices();
    
    // Show success message
    alert(`Payment of ₹${amountPaid.toFixed(2)} processed successfully!`);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate remaining amount
  const calculateRemainingAmount = (invoice) => {
    return parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0);
  };

  return (
    <div className="pending-invoices-list p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pending Invoices</h2>
          <p className="text-sm text-gray-500">
            Showing {counts.total} invoices ({counts.pending} pending, {counts.partial} partially paid)
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">Total Pending: {formatCurrency(totalPendingAmount)}</p>
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={fetchPendingInvoices}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && <p className="text-center py-4">Loading pending invoices...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && pendingInvoices.length === 0 && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded text-center">
          <p className="text-lg">No pending invoices found!</p>
          <p className="text-sm mt-2">All invoices have been paid in full.</p>
        </div>
      )}

      {!loading && !error && pendingInvoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.customers?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(invoice.amount_paid || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(calculateRemainingAmount(invoice))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${invoice.payment_status === 'partial' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {invoice.payment_status === 'partial' ? 'Partially Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handlePaymentClick(invoice)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Complete Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default PendingInvoicesList;
