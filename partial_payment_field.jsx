import React from 'react';

/**
 * A reusable component for handling partial payment input
 * 
 * @param {Object} props - Component props
 * @param {Object} props.formData - Form data object containing payment information
 * @param {Function} props.setFormData - Function to update form data
 * @param {string} props.currency - Currency symbol (defaults to ₹)
 * @param {boolean} props.showOnlyForPartial - When true, only shows when payment status is partial
 */
const PartialPaymentField = ({ 
  formData, 
  setFormData, 
  currency = '₹',
  disabled = false,
  showOnlyForPartial = false
}) => {
  // Calculate remaining amount
  const remainingAmount = Math.max(0, 
    (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.amount_paid) || 0)
  );

  // Handle change in amount paid
  const handleAmountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    const total = parseFloat(formData.total_amount) || 0;
    
    // Ensure the amount is not negative and not more than total amount
    const validAmount = Math.min(Math.max(0, value), total);
    
    setFormData({
      ...formData, 
      amount_paid: validAmount,
      payment_status: validAmount >= total ? 'paid' : (validAmount > 0 ? 'partial' : 'pending')
    });
  };

  // If showOnlyForPartial is true, only render for partial payment status
  if (showOnlyForPartial && formData.payment_status !== 'partial') {
    return null;
  }

  return (
    <div className="partial-payment-field">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount Paid <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-slate-500">{currency}</span>
          <input
            type="number"
            value={formData.amount_paid || ''}
            onChange={handleAmountChange}
            disabled={disabled}
            min="0"
            max={formData.total_amount}
            step="0.01"
            className={`w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 ${
              disabled ? 'bg-slate-100 cursor-not-allowed' : ''
            }`}
            placeholder="0.00"
            required
          />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Remaining: {currency}{remainingAmount.toFixed(2)}
        </div>
      </div>
      
      {/* Payment Status Badge */}
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
          formData.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
          formData.payment_status === 'partial' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {formData.payment_status === 'paid' ? 'Paid' :
           formData.payment_status === 'partial' ? 'Partially Paid' : 'Pending'}
        </span>
      </div>
    </div>
  );
};

export default PartialPaymentField;
