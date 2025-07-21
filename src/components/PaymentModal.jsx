import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';

const PaymentModal = ({ invoice, onClose, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [processing, setProcessing] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [amountPaid, setAmountPaid] = useState(invoice?.total_amount || 0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    // Set default amount to full invoice amount
    setAmountPaid(invoice?.total_amount || 0);
    // Check if this is already a partial payment
    if (invoice?.payment_status === 'partial' && invoice?.amount_paid) {
      setIsPartialPayment(true);
      setAmountPaid(invoice.amount_paid || 0);
      setRemainingAmount(invoice.total_amount - (invoice.amount_paid || 0));
    }
    // Escape key handler
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [invoice, onClose]);
  
  // Handle amount paid change
  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const total = parseFloat(invoice.total_amount) || 0;
    
    // Ensure the amount is not negative and not more than total amount
    const validAmount = Math.min(Math.max(0, value), total);
    setAmountPaid(validAmount);
    setRemainingAmount(total - validAmount);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mobile_payment', label: 'Mobile Payment' }
  ];

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      const totalAmount = parseFloat(invoice.total_amount);
      const paidAmount = parseFloat(amountPaid);
      
      // Determine if this is a full or partial payment
      const paymentStatus = (paidAmount >= totalAmount) ? 'paid' : 'partial';
      
      // Call the appropriate function based on payment type
      if (paymentStatus === 'paid') {
        await billingAccountsIntegration.markInvoiceAsPaid(invoice.id, paymentMethod);
      } else {
        await billingAccountsIntegration.recordPartialPayment(invoice.id, paidAmount, paymentMethod);
      }
      
      // Call parent callback
      onPaymentComplete(invoice.id, paymentMethod, paidAmount, paymentStatus);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(`Error processing payment: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
      >
        <h2 className="text-xl font-bold mb-4">Record Payment</h2>
        
        <div className="mb-6">
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-slate-600 mb-1">
              Invoice: <span className="font-medium">{invoice.invoice_number}</span>
            </p>
            <p className="text-sm text-slate-600 mb-1">
              Customer: <span className="font-medium">{invoice.customers?.name}</span>
            </p>
            <p className="text-sm text-slate-600 mb-1">
              Total Amount: <span className="font-medium">₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
            </p>
            {invoice.payment_status === 'partial' && invoice.amount_paid > 0 && (
              <p className="text-sm text-slate-600 mb-1">
                Previously Paid: <span className="font-medium">₹{parseFloat(invoice.amount_paid).toFixed(2)}</span>
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <input
                id="fullPayment"
                type="radio"
                checked={!isPartialPayment}
                onChange={() => {
                  setIsPartialPayment(false);
                  setAmountPaid(invoice.total_amount - (invoice.amount_paid || 0));
                }}
                className="mr-2"
              />
              <label htmlFor="fullPayment" className="text-sm font-medium text-gray-700">
                Full Payment (₹{(parseFloat(invoice.total_amount) - (parseFloat(invoice.amount_paid) || 0)).toFixed(2)})
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="partialPayment"
                type="radio"
                checked={isPartialPayment}
                onChange={() => setIsPartialPayment(true)}
                className="mr-2"
              />
              <label htmlFor="partialPayment" className="text-sm font-medium text-gray-700">
                Partial Payment
              </label>
            </div>
          </div>
          
          {isPartialPayment && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Being Paid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2">₹</span>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={handleAmountChange}
                  min="0"
                  max={invoice.total_amount}
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2"
                />
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Total Invoice Amount:</span>
                  <span className="font-medium">₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Amount Being Paid:</span>
                  <span className="font-medium">₹{parseFloat(amountPaid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1 border-t border-blue-200 pt-1">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">₹{(parseFloat(invoice.total_amount) - parseFloat(amountPaid)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            disabled={processing || (isPartialPayment && amountPaid <= 0)}
          >
            {processing ? 'Processing...' : 'Record Payment'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PaymentModal;
