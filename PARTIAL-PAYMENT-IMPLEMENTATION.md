# Partial Payment Implementation Guide

This guide explains how to implement the partial payment functionality in your billing system.

## 1. Components Overview

### PartialPaymentField Component
The reusable component (`partial_payment_field.jsx`) handles input for partial payments with automatic calculation of remaining amounts and status updates.

### PaymentModal Component
The updated payment modal (`PaymentModal-Updated.jsx`) demonstrates how to integrate the PartialPaymentField into a payment form.

## 2. Database Requirements

The partial payment system requires these fields in your `invoices` table:

- `total_amount`: The full invoice amount
- `amount_paid`: The total amount paid so far (initially 0)
- `payment_status`: One of 'pending', 'partial', 'paid', or 'cancelled'

## 3. Implementation Options

### Option 1: Use PartialPaymentField in Forms

```jsx
import React, { useState } from 'react';
import PartialPaymentField from './partial_payment_field';

function InvoiceForm() {
  const [invoiceData, setInvoiceData] = useState({
    invoice_number: 'INV-001',
    total_amount: 1000,
    amount_paid: 0,
    payment_status: 'pending'
  });

  return (
    <form>
      {/* Other form fields */}
      <PartialPaymentField formData={invoiceData} setFormData={setInvoiceData} />
      {/* Submit buttons */}
    </form>
  );
}
```

### Option 2: Replace Existing PaymentModal

Replace your current `PaymentModal.jsx` with the updated version that includes the PartialPaymentField component.

### Option 3: Add Partial Payment to Invoice List

```jsx
function InvoiceListItem({ invoice, onPaymentComplete }) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  return (
    <div className="invoice-item">
      <div className="invoice-details">
        <h3>Invoice #{invoice.invoice_number}</h3>
        <div className="amount-info">
          <span>Total: ₹{invoice.total_amount}</span>
          {invoice.payment_status === 'partial' && (
            <>
              <span>Paid: ₹{invoice.amount_paid}</span>
              <span>Remaining: ₹{invoice.total_amount - invoice.amount_paid}</span>
            </>
          )}
        </div>
        <div className={`status-badge ${invoice.payment_status}`}>
          {invoice.payment_status}
        </div>
      </div>
      
      {/* Only show pay button for pending/partial invoices */}
      {(invoice.payment_status === 'pending' || invoice.payment_status === 'partial') && (
        <button onClick={() => setShowPaymentModal(true)}>
          Make Payment
        </button>
      )}
      
      {showPaymentModal && (
        <PaymentModal 
          invoice={invoice} 
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={onPaymentComplete}
        />
      )}
    </div>
  );
}
```

## 4. Backend Integration

The `billingAccountsIntegration.js` utility already provides the necessary functions:

### recordPartialPayment

This function handles recording partial payments:

```javascript
async recordPartialPayment(invoiceId, amountPaid, paymentMethod = 'cash') {
  // Fetches invoice details
  // Calculates new total (previous + current payment)
  // Updates status to 'paid' if fully paid
  // Creates ledger entry and payment record
}
```

### markInvoiceAsPaid

For full payments:

```javascript
async markInvoiceAsPaid(invoiceId, paymentMethod = 'cash') {
  // Updates invoice to paid status
  // Creates ledger entry and payment record
}
```

## 5. Displaying Pending/Partial Payments

To display payments that need completion:

```jsx
function PendingPaymentsList() {
  const [pendingInvoices, setPendingInvoices] = useState([]);
  
  useEffect(() => {
    async function fetchPendingInvoices() {
      const { data } = await supabase
        .from('invoices')
        .select('*, customers(name)')
        .in('payment_status', ['pending', 'partial'])
        .order('invoice_date', { ascending: false });
      
      setPendingInvoices(data || []);
    }
    
    fetchPendingInvoices();
  }, []);
  
  return (
    <div className="pending-payments">
      <h2>Pending Payments</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingInvoices.map(invoice => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>{invoice.customers?.name}</td>
              <td>₹{invoice.total_amount}</td>
              <td>₹{invoice.amount_paid || 0}</td>
              <td>₹{invoice.total_amount - (invoice.amount_paid || 0)}</td>
              <td>
                <span className={`status-badge ${invoice.payment_status}`}>
                  {invoice.payment_status === 'partial' ? 'Partially Paid' : 'Pending'}
                </span>
              </td>
              <td>
                <button onClick={() => handlePaymentClick(invoice)}>
                  Complete Payment
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 6. API Endpoints for Other Pages

To fetch pending/partial payments for other pages, create these API endpoints:

```javascript
// In your API file
const pendingInvoicesAPI = {
  // Get all pending invoices for a customer
  async getCustomerPendingInvoices(customerId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .in('payment_status', ['pending', 'partial'])
      .eq('customer_id', customerId)
      .order('invoice_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },
  
  // Get all pending invoices
  async getAllPendingInvoices() {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customers(name)')
      .in('payment_status', ['pending', 'partial'])
      .order('invoice_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },
  
  // Get total pending amount
  async getTotalPendingAmount() {
    const { data, error } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid')
      .in('payment_status', ['pending', 'partial']);
      
    if (error) throw error;
    
    return (data || []).reduce((total, invoice) => {
      const pending = invoice.total_amount - (invoice.amount_paid || 0);
      return total + pending;
    }, 0);
  }
};
```

## 7. Testing Checklist

- [ ] Create a new invoice with partial payment
- [ ] Make additional payment on a partial invoice
- [ ] Verify status changes to 'paid' when fully paid
- [ ] Check customer account statements reflect correct pending amounts
- [ ] Verify pending invoices appear in pending lists
- [ ] Test API endpoints return correct data
- [ ] Validate UI updates immediately after payment

## 8. Styling Guide

Add these CSS classes to your stylesheet:

```css
/* Status Badge Styles */
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge.partial {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge.paid {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge.cancelled {
  background-color: #fee2e2;
  color: #b91c1c;
}
```
