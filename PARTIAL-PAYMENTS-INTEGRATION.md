# Billing Accounts Integration - Partial Payments Feature

This document explains how the partial payment functionality works and how to use the billing accounts integration in other pages.

## Overview

The system now properly handles partial payments and updates the pending amounts in the financial overview cards. When you create an invoice with partial payment status, the remaining balance is automatically calculated and shown in the "Pending" amount card.

## Key Features

### 1. Partial Payment Support
- When creating a new invoice, you can select "Partial" payment status
- Enter the amount paid, and the system automatically calculates the remaining balance
- The remaining balance is included in the "Total Pending" amount shown in the dashboard

### 2. Proper Account Tracking
- Full pending invoices: Show the complete invoice amount as pending
- Partial payments: Show only the remaining balance (total - amount_paid) as pending
- The system creates appropriate ledger entries for both the pending invoice and the partial payment

### 3. API Functions for Other Pages

#### `getAccountSummary(options)`
Get account summary that can be used in other pages like the accounts page.

```javascript
import { getAccountSummary } from '../utils/billingAccountsIntegration';

// Get last 30 days summary (matches billing dashboard)
const summary = await getAccountSummary({ timePeriod: 'last30days' });

// Get overall summary (all time)
const summary = await getAccountSummary({ timePeriod: 'all' });
```

#### `getPendingAmountsBreakdown()`
Get detailed breakdown of pending amounts including partial payments.

```javascript
import { getPendingAmountsBreakdown } from '../utils/billingAccountsIntegration';

const breakdown = await getPendingAmountsBreakdown();
console.log(breakdown);
// Returns:
// {
//   pendingInvoices: [...],     // Fully pending invoices
//   partialInvoices: [...],     // Partially paid invoices
//   totals: {
//     pendingTotal: 0,          // Total from fully pending invoices
//     partialTotal: 0,          // Total remaining from partial invoices
//     totalPending: 0           // Combined total pending
//   }
// }
```

## Implementation Details

### Database Changes
The system uses the existing `amount_paid` column in the invoices table to track partial payments.

### Calculation Logic
- **Pending invoices**: Full `total_amount` is considered pending
- **Partial invoices**: `total_amount - amount_paid` is considered pending
- **Paid invoices**: 0 is considered pending

### Account Integration
When creating invoices with partial payments:
1. A pending ledger entry is created for the full invoice amount
2. A payment ledger entry is created for the partial payment amount
3. A payment record is created for the partial payment

## Usage Examples

### 1. Creating a Partial Payment Invoice
1. Click "Create Invoice" in the billing page
2. Fill in customer and invoice items
3. Select "Partial" as payment status
4. Enter the amount paid (must be less than total amount)
5. The system will automatically calculate and show the remaining balance

### 2. Using in Accounts Page
```javascript
import React, { useState, useEffect } from 'react';
import { getAccountSummary, getPendingAmountsBreakdown } from '../utils/billingAccountsIntegration';

const AccountsPage = () => {
  const [summary, setSummary] = useState(null);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const accountSummary = await getAccountSummary({ timePeriod: 'all' });
      const pendingData = await getPendingAmountsBreakdown();
      
      setSummary(accountSummary);
      setPendingBreakdown(pendingData);
    };
    
    fetchData();
  }, []);

  return (
    <div>
      <h1>Accounts Overview</h1>
      {summary && (
        <div>
          <p>Total Pending: ₹{summary.totalPending.toFixed(2)}</p>
          <p>Total Paid: ₹{summary.totalPaid.toFixed(2)}</p>
          <p>Total Invoiced: ₹{summary.totalInvoiced.toFixed(2)}</p>
        </div>
      )}
      
      {pendingBreakdown && (
        <div>
          <h2>Pending Breakdown</h2>
          <p>Fully Pending: ₹{pendingBreakdown.totals.pendingTotal.toFixed(2)}</p>
          <p>Partial Remaining: ₹{pendingBreakdown.totals.partialTotal.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};
```

### 3. Real-time Updates
The financial overview cards are automatically updated when:
- New invoices are created
- Payments are recorded
- Invoices are edited
- Payment status is changed

## Files Modified

1. **`src/utils/billingAccountsIntegration.js`**
   - Enhanced `getBillingAccountSummary()` to properly calculate partial payments
   - Added `getOverallAccountSummary()` for all-time data
   - Added `getAccountSummary()` and `getPendingAmountsBreakdown()` utility functions

2. **`src/pages/Billing.jsx`**
   - Enhanced `createInvoice()` to handle partial payment accounting
   - Enhanced `updateInvoice()` to refresh accounts summary
   - Enhanced `handlePaymentComplete()` to refresh data

3. **`src/components/AccountsSummaryExample.jsx`**
   - Example component showing how to use the new functions

## Testing

To test the partial payment functionality:
1. Create a new invoice with partial payment status
2. Enter an amount paid that's less than the total
3. Check that the "Pending" card shows the correct remaining balance
4. Verify that the accounts summary updates correctly
5. Test that the functionality works across page refreshes

## Notes

- The system maintains backward compatibility with existing invoices
- All partial payment data is properly integrated with the accounts system
- The pending amounts are calculated in real-time and cached for performance
- Error handling is implemented to prevent invoice creation failures if account integration fails
