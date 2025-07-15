# Using the PartialPaymentField Component

The `PartialPaymentField` component is designed to handle partial payment functionality in forms throughout your application. Here's how to use it effectively:

## Basic Usage

```jsx
import React, { useState } from 'react';
import PartialPaymentField from './partial_payment_field';

function InvoiceForm() {
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: 'INV-001',
    total_amount: 1000,
    amount_paid: 0,
    payment_status: 'pending',
    // ...other invoice fields
  });

  return (
    <form>
      {/* Other form fields */}
      
      <PartialPaymentField
        formData={invoiceData}
        setFormData={setInvoiceData}
      />
      
      {/* Submit buttons */}
    </form>
  );
}
```

## Features

1. **Automatic Payment Status**:
   - The component automatically updates `payment_status` based on the amount paid:
     - `paid` when amount_paid equals total_amount
     - `partial` when amount_paid is greater than 0 but less than total_amount
     - `pending` when amount_paid is 0

2. **Remaining Amount Calculation**:
   - Displays the remaining balance that needs to be paid

3. **Status Badge**:
   - Shows a color-coded badge indicating the current payment status

## Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| formData | Object | required | Object containing payment data including amount_paid, total_amount, and payment_status |
| setFormData | Function | required | Function to update the form data |
| currency | String | "₹" | Currency symbol to display |
| disabled | Boolean | false | Whether the input field is disabled |
| showOnlyForPartial | Boolean | false | When true, only renders for "partial" payment status |

## Integration with Existing Components

### Example: Adding to PaymentModal.jsx

```jsx
import React, { useState } from 'react';
import PartialPaymentField from './partial_payment_field';

function PaymentModal({ invoice, onSubmit }) {
  const [paymentData, setPaymentData] = useState({
    ...invoice,
    payment_method: 'cash',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(paymentData);
  };

  return (
    <div className="payment-modal">
      <h2>Process Payment</h2>
      
      <form onSubmit={handleSubmit}>
        <PartialPaymentField
          formData={paymentData}
          setFormData={setPaymentData}
        />
        
        {/* Payment method selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Payment Method</label>
          <select
            value={paymentData.payment_method}
            onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
            className="w-full border rounded-lg p-2 mt-1"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </div>
        
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Complete Payment
        </button>
      </form>
    </div>
  );
}
```

## Connecting with the Backend

When submitting the form, use the `billingAccountsIntegration` utility to process the payment:

```jsx
// Inside your form submission handler
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    if (formData.payment_status === 'paid') {
      await billingAccountsIntegration.markInvoiceAsPaid(
        formData.id, 
        formData.payment_method
      );
    } else if (formData.payment_status === 'partial') {
      await billingAccountsIntegration.recordPartialPayment(
        formData.id, 
        formData.amount_paid,
        formData.payment_method
      );
    }
    
    // Handle success
    onClose();
    refreshData();
  } catch (error) {
    console.error('Payment processing error:', error);
    // Handle error
  }
};
```

This component works with your existing `billingAccountsIntegration` utilities that already handle updating invoice payment status based on the amount paid.
