# Pending Payments Feature

## Overview
A comprehensive pending payments management system that allows users to view, track, and manage all pending invoices and partial payments from a dedicated sub-page within the accounts section.

## Features

### 1. Pending Payments Page (`/accounts/pending`)
- View all pending invoices and partial payments in one place
- Real-time calculation of pending amounts including partial payment remainders
- Summary cards showing different types of pending amounts
- Sortable table with multiple sorting options
- Detailed invoice view with customer information

### 2. Sorting Options
- **Date Sorting**: Sort by invoice date (newest first, oldest first)
- **Amount Sorting**: Sort by pending amount (highest first, lowest first)
- Independent dropdown controls for each sorting type

### 3. Detailed Invoice View
- Click any invoice to see detailed information
- Customer details (name, phone, email, address)
- Invoice items with product details and variants
- Payment history and remaining balance
- Direct payment recording capability

### 4. Summary Cards
- **Fully Pending**: Total amount from invoices with no payments
- **Partial Remaining**: Total remaining amount from partially paid invoices
- **Total Pending**: Combined total of all pending amounts

## Usage

### Accessing the Page
1. Navigate to `/accounts/pending`
2. Or click "Pending" in the accounts navigation menu

### Viewing Pending Invoices
- All pending invoices are displayed in a sortable table
- Use the sorting dropdowns to organize by date or amount
- Click refresh to update the data

### Viewing Invoice Details
- Click on any invoice row to open the detailed view
- Review customer information and invoice items
- See payment history and remaining balance
- Record payments directly from the detail view

### Recording Payments
- Click "Record Payment" from the invoice detail view
- Select payment method and amount
- For partial payments, the system will automatically calculate the remaining balance

## Technical Implementation

### Components
- **PendingPayments.jsx**: Main page component
- **PendingInvoiceDetail.jsx**: Detailed invoice view modal
- **PaymentModal.jsx**: Payment recording modal (reused from billing)

### API Functions
- `getPendingAmountsBreakdown()`: Get detailed breakdown of pending amounts
- `getAccountSummary()`: Get overall account summary
- `billingAccountsIntegration.recordPartialPayment()`: Record partial payments

### Data Structure
```javascript
{
  pendingInvoices: [
    {
      id: "uuid",
      invoice_number: "INV-123456",
      customer_name: "John Doe",
      total_amount: 1000,
      pending_amount: 1000,
      invoice_date: "2025-01-15"
    }
  ],
  partialInvoices: [
    {
      id: "uuid",
      invoice_number: "INV-123457",
      customer_name: "Jane Smith",
      total_amount: 1500,
      amount_paid: 500,
      pending_amount: 1000,
      invoice_date: "2025-01-14"
    }
  ],
  totals: {
    pendingTotal: 1000,
    partialTotal: 1000,
    totalPending: 2000
  }
}
```

### Integration Points
- Updates in real-time when payments are recorded
- Integrates with the existing billing system
- Works with the accounts management system
- Maintains consistency with the main billing dashboard

## Database Requirements
Make sure the following columns exist in your `invoices` table:
- `amount_paid` (decimal) - Tracks partial payment amounts
- `payment_date` (timestamp) - Optional, for payment tracking

Run the schema update script if needed:
```sql
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS amount_paid decimal(12,2) default 0;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;
```

## Navigation
The pending payments page is integrated into the accounts navigation:
- Path: `/accounts/pending`
- Icon: ⏳
- Permission: `PERMISSIONS.billing.view`

## Styling
- Responsive design that works on mobile and desktop
- Consistent with the existing UI theme
- Hover effects and animations for better user experience
- Color-coded status indicators

## Error Handling
- Graceful handling of network errors
- Loading states during data fetching
- Validation for payment amounts
- User-friendly error messages

This feature provides a comprehensive solution for managing pending payments with intuitive sorting, detailed views, and seamless integration with the existing billing system.
