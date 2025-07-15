import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';
import PartialPaymentField from '../../partial_payment_field';

const PaymentModal = ({ invoice, onClose, onPaymentComplete }) => {
  const [processing, setProcessing] = useState(false);
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  
  // Create a form state object that includes all necessary payment fields
  const [paymentData, setPaymentData] = useState({
    id: invoice?.id,
    invoice_number: invoice?.invoice_number,
    total_amount: parseFloat(invoice?.total_amount) || 0,
    amount_paid: parseFloat(invoice?.total_amount) || 0,
    previous_amount_paid: parseFloat(invoice?.amount_paid) || 0,
    payment_status: 'paid',
    payment_method: 'cash'
  });
  
  useEffect(() => {
    // Check if this is already a partial payment
    if (invoice?.payment_status === 'partial' && invoice?.amount_paid) {
      setIsPartialPayment(true);
      // For partial payments, we want to show the remaining amount needed
      const remainingAmount = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0);
      
      setPaymentData({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        total_amount: parseFloat(invoice.total_amount) || 0,
        amount_paid: remainingAmount, // Default to paying the remaining amount
        previous_amount_paid: parseFloat(invoice.amount_paid) || 0,
        payment_status: 'paid', // Default to full payment (will be updated if partial)
        payment_method: 'cash'
      });
    } else {
      // For new payments, default to full amount
      setPaymentData({
        id: invoice?.id,
        invoice_number: invoice?.invoice_number,
        total_amount: parseFloat(invoice?.total_amount) || 0,
        amount_paid: parseFloat(invoice?.total_amount) || 0,
        previous_amount_paid: parseFloat(invoice?.amount_paid) || 0,
        payment_status: 'paid',
        payment_method: 'cash'
      });
    }
  }, [invoice]);
  
  // Update payment data when full/partial payment selection changes
  useEffect(() => {
    if (isPartialPayment) {
      // Reset to 0 when switching to partial payment
      setPaymentData({
        ...paymentData,
        amount_paid: 0,
        payment_status: 'partial'
      });
    } else {
      // Set to full remaining amount when switching to full payment
      const remainingAmount = paymentData.total_amount - paymentData.previous_amount_paid;
      setPaymentData({
        ...paymentData,
        amount_paid: remainingAmount,
        payment_status: 'paid'
      });
    }
  }, [isPartialPayment]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      
      const totalAmount = parseFloat(invoice.total_amount);
      const previouslyPaid = parseFloat(invoice.amount_paid || 0);
      const currentPayment = parseFloat(paymentData.amount_paid);
      const totalPaid = previouslyPaid + currentPayment;
      
      // Determine if this is a full or partial payment
      const paymentStatus = (totalPaid >= totalAmount) ? 'paid' : 'partial';
      
      // Call the appropriate function based on payment type
      if (paymentStatus === 'paid') {
        await billingAccountsIntegration.markInvoiceAsPaid(invoice.id, paymentData.payment_method);
      } else {
        await billingAccountsIntegration.recordPartialPayment(invoice.id, currentPayment, paymentData.payment_method);
      }
      
      // Call parent callback
      onPaymentComplete(invoice.id, paymentData.payment_method, currentPayment, paymentStatus);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      setProcessing(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'mobile_payment', label: 'Mobile Payment' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        className="bg-white rounded-lg w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Process Payment</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-base font-medium text-gray-900">Invoice #{invoice?.invoice_number}</h3>
            <p className="text-sm text-gray-500">Total Amount: ₹{parseFloat(invoice?.total_amount).toFixed(2)}</p>
            {invoice?.payment_status === 'partial' && (
              <p className="text-sm text-green-600">
                Previously Paid: ₹{parseFloat(invoice?.amount_paid || 0).toFixed(2)}
              </p>
            )}
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Type</h4>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                <input
                  id="fullPayment"
                  type="radio"
                  checked={!isPartialPayment}
                  onChange={() => setIsPartialPayment(false)}
                  className="mr-2"
                />
                <label htmlFor="fullPayment" className="text-sm font-medium text-gray-700">
                  Full Payment (₹{(parseFloat(invoice?.total_amount) - parseFloat(invoice?.amount_paid || 0)).toFixed(2)})
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
          </div>
          
          {isPartialPayment && (
            <PartialPaymentField
              formData={paymentData}
              setFormData={setPaymentData}
            />
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentData.payment_method}
              onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="mr-2 px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-md text-sm text-white ${processing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              onClick={handlePayment}
              disabled={processing || (isPartialPayment && parseFloat(paymentData.amount_paid) <= 0)}
            >
              {processing ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
