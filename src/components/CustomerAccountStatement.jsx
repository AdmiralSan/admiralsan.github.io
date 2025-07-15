import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';

const CustomerAccountStatement = ({ customer, onClose }) => {
  const { formatCurrency } = useCurrency();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customer?.id) {
      fetchAccountStatement();
    }
  }, [customer]);

  const fetchAccountStatement = async () => {
    try {
      setLoading(true);
      const data = await billingAccountsIntegration.getCustomerAccountStatement(customer.id);
      setAccountData(data);
    } catch (error) {
      console.error('Error fetching account statement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading account statement...</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Account Statement</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-lg mb-2">{customer.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Phone: {customer.phone}</p>
                <p className="text-gray-600">Email: {customer.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Address: {customer.address}</p>
              </div>
            </div>
          </div>

          {/* Account Summary */}
          {accountData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800">Total Invoiced</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(accountData.summary.totalInvoiced)}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800">Total Paid</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(accountData.summary.totalPaid)}
                </p>
              </div>
              <div className={`rounded-lg p-4 ${
                accountData.summary.balance > 0 ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold ${
                  accountData.summary.balance > 0 ? 'text-red-800' : 'text-gray-800'
                }`}>
                  Balance
                </h4>
                <p className={`text-2xl font-bold ${
                  accountData.summary.balance > 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {formatCurrency(accountData.summary.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Invoices</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 px-4 py-2 text-left">Invoice #</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Amount</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accountData?.invoices?.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2">
                        {invoice.invoice_number}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="border border-gray-200 px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(invoice.payment_status)}`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments Table */}
          {accountData?.payments?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Payments</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Amount</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Method</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountData.payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {payment.payment_method}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {payment.reference}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomerAccountStatement;
