import { supabase } from '../supabaseClient';
import { ledgerAPI, paymentsAPI } from './accountsAPI';
import { getCurrentUserId, ensureUserExists } from './clerkUserUtils';

// Helper function to get current user from Clerk
const getCurrentUser = async (userId = null) => {
  try {
    // If userId is provided, use it directly
    if (userId) {
      return { id: userId };
    }
    
    // Get current user from Clerk and ensure they exist in database
    if (typeof window !== 'undefined' && window.Clerk) {
      const clerkUser = window.Clerk.user;
      if (clerkUser) {
        // Ensure user exists in database
        await ensureUserExists(clerkUser);
        return { id: clerkUser.id };
      }
    }
    
    throw new Error('User not authenticated');
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('User not authenticated');
  }
};

// Integration functions to connect billing with accounts
export const billingAccountsIntegration = {
  // Create ledger entry when invoice is created (pending payment)
  async createPendingLedgerEntry(invoice, userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const ledgerEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toTimeString().split(' ')[0],
        entry_type: 'income',
        category: 'accounts_receivable',
        description: `Invoice Created - ${invoice.invoice_number}`,
        amount: invoice.total_amount,
        reference_number: invoice.invoice_number,
        vendor_customer: invoice.customers?.name || 'Unknown',
        payment_method: 'pending',
        notes: `Pending payment for invoice ${invoice.invoice_number}`
      };

      const ledgerResult = await ledgerAPI.createLedgerEntry(ledgerEntry, user.id);
      return ledgerResult;
    } catch (error) {
      console.error('Error creating pending ledger entry:', error);
      throw error;
    }
  },

  // Create ledger entry when invoice is paid
  async createLedgerEntryFromInvoice(invoice, paymentMethod = 'cash', userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const ledgerEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toTimeString().split(' ')[0],
        entry_type: 'income',
        category: 'sales',
        description: `Invoice Payment - ${invoice.invoice_number}`,
        amount: invoice.total_amount,
        reference_number: invoice.invoice_number,
        vendor_customer: invoice.customers?.name || 'Unknown',
        payment_method: paymentMethod,
        notes: `Payment for invoice ${invoice.invoice_number}`
      };

      const ledgerResult = await ledgerAPI.createLedgerEntry(ledgerEntry, user.id);
      return ledgerResult;
    } catch (error) {
      console.error('Error creating ledger entry from invoice:', error);
      throw error;
    }
  },

  // Create payment record when invoice is paid
  async createPaymentFromInvoice(invoice, paymentMethod = 'cash') {
    try {
      const paymentRecord = {
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'received',
        amount: invoice.total_amount,
        customer_vendor_name: invoice.customers?.name || 'Unknown',
        reference_number: invoice.invoice_number,
        payment_method: paymentMethod,
        payment_status: 'completed',
        notes: `Payment for invoice ${invoice.invoice_number}`,
        invoice_id: invoice.id
      };

      const paymentResult = await paymentsAPI.createPayment(paymentRecord);
      return paymentResult;
    } catch (error) {
      console.error('Error creating payment from invoice:', error);
      throw error;
    }
  },

  // Get customer account statement
  async getCustomerAccountStatement(customerId) {
    try {
      // Get all invoices for the customer
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (name, phone, email)
        `)
        .eq('customer_id', customerId)
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Get all payments for the customer by customer name
      // Since payments table doesn't have customer_id, we'll match by customer name
      const customerName = invoices.length > 0 ? invoices[0].customers?.name : null;
      let payments = [];
      
      if (customerName) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('customer_vendor_name', customerName)
          .order('payment_date', { ascending: false });

        if (paymentsError) throw paymentsError;
        payments = paymentsData || [];
      }

      // Only count pending/partial invoices for balance
      const totalInvoiced = invoices
        .filter(inv => inv.payment_status === 'pending' || inv.payment_status === 'partial')
        .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
      const totalPaid = payments?.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0) || 0;
      // For balance, sum pending amounts only
      const balance = invoices
        .filter(inv => inv.payment_status === 'pending' || inv.payment_status === 'partial')
        .reduce((sum, inv) => {
          if (inv.payment_status === 'pending') {
            return sum + parseFloat(inv.total_amount || 0);
          } else if (inv.payment_status === 'partial') {
            return sum + (parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0));
          }
          return sum;
        }, 0);

      return {
        invoices: invoices || [],
        payments: payments || [],
        summary: {
          totalInvoiced,
          totalPaid,
          balance
        }
      };
    } catch (error) {
      console.error('Error fetching customer account statement:', error);
      throw error;
    }
  },

  // Update invoice payment status and create account entries
  async markInvoiceAsPaid(invoiceId, paymentMethod = 'cash') {
    try {
      // First, get the invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          payment_status: 'paid',
          payment_method: paymentMethod,
          amount_paid: invoice.total_amount // Set amount paid to full amount
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Create ledger entry
      await this.createLedgerEntryFromInvoice(invoice, paymentMethod);

      // Create payment record
      await this.createPaymentFromInvoice(invoice, paymentMethod);

      return { success: true, message: 'Invoice marked as paid and account entries created' };
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
    }
  },
  
  // Record partial payment for an invoice
  async recordPartialPayment(invoiceId, amountPaid, paymentMethod = 'cash') {
    try {
      // First, get the invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      // Calculate total amount paid (previous + current payment)
      const previousAmountPaid = parseFloat(invoice.amount_paid || 0);
      const totalPaid = previousAmountPaid + parseFloat(amountPaid);

      // Determine new payment status
      let newStatus = 'partial';
      if (totalPaid >= parseFloat(invoice.total_amount)) {
        newStatus = 'paid';
      }

      // Update invoice status and amount paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          payment_status: newStatus,
          payment_method: paymentMethod,
          amount_paid: totalPaid
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Create partial payment ledger entry
      await this.createPartialPaymentLedgerEntry(invoice, amountPaid, paymentMethod);

      // Create partial payment record
      await this.createPartialPayment(invoice, amountPaid, paymentMethod);

      return { success: true, message: `${newStatus === 'paid' ? 'Full payment completed' : 'Partial payment recorded'} and account entries created` };
    } catch (error) {
      console.error('Error recording partial payment:', error);
      throw error;
    }
  },
  
  // Create ledger entry for partial payment
  async createPartialPaymentLedgerEntry(invoice, amountPaid, paymentMethod = 'cash', userId = null) {
    try {
      const user = await getCurrentUser(userId);
      if (!user) throw new Error('User not authenticated');

      const ledgerEntry = {
        entry_date: new Date().toISOString().split('T')[0],
        entry_time: new Date().toTimeString().split(' ')[0],
        entry_type: 'income',
        category: 'sales',
        description: `Partial Payment - ${invoice.invoice_number}`,
        amount: amountPaid,
        reference_number: invoice.invoice_number,
        vendor_customer: invoice.customers?.name || 'Unknown',
        payment_method: paymentMethod,
        notes: `Partial payment of ₹${amountPaid} for invoice ${invoice.invoice_number}`
      };

      const ledgerResult = await ledgerAPI.createLedgerEntry(ledgerEntry, user.id);
      return ledgerResult;
    } catch (error) {
      console.error('Error creating partial payment ledger entry:', error);
      throw error;
    }
  },
  
  // Create payment record for partial payment
  async createPartialPayment(invoice, amountPaid, paymentMethod = 'cash') {
    try {
      const paymentRecord = {
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'received',
        amount: amountPaid,
        customer_vendor_name: invoice.customers?.name || 'Unknown',
        reference_number: invoice.invoice_number,
        payment_method: paymentMethod,
        payment_status: 'completed',
        notes: `Partial payment of ₹${amountPaid} for invoice ${invoice.invoice_number}`,
        invoice_id: invoice.id
      };

      const paymentResult = await paymentsAPI.createPayment(paymentRecord);
      return paymentResult;
    } catch (error) {
      console.error('Error creating partial payment record:', error);
      throw error;
    }
  },

  // Get account summary for billing dashboard
  async getBillingAccountSummary() {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get invoices summary with amount_paid field
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('payment_status, total_amount, amount_paid, invoice_date')
        .gte('invoice_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (invoicesError) throw invoicesError;

      // Get payments summary
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_type')
        .gte('payment_date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (paymentsError) throw paymentsError;

      // Calculate summaries
      const totalInvoiced = invoicesData?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
      
      // Calculate total paid - full amount for 'paid' invoices + amount_paid for 'partial' invoices
      const totalPaid = invoicesData?.reduce((sum, inv) => {
        if (inv.payment_status === 'paid') {
          return sum + parseFloat(inv.total_amount || 0);
        } else if (inv.payment_status === 'partial') {
          return sum + parseFloat(inv.amount_paid || 0);
        }
        return sum;
      }, 0) || 0;
      
      // Calculate total pending - full amount for 'pending' invoices + remaining balance for 'partial' invoices
      const totalPending = invoicesData?.reduce((sum, inv) => {
        if (inv.payment_status === 'pending') {
          return sum + parseFloat(inv.total_amount || 0);
        } else if (inv.payment_status === 'partial') {
          const totalAmount = parseFloat(inv.total_amount || 0);
          const amountPaid = parseFloat(inv.amount_paid || 0);
          const remainingBalance = totalAmount - amountPaid;
          return sum + remainingBalance;
        }
        return sum;
      }, 0) || 0;
      
      const totalReceived = paymentsData?.filter(pay => pay.payment_type === 'received')
        .reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0) || 0;

      return {
        totalInvoiced,
        totalPaid,
        totalPending,
        totalReceived,
        accountsReceivable: totalPending
      };
    } catch (error) {
      console.error('Error fetching billing account summary:', error);
      throw error;
    }
  },

  // Get overall account summary (all time) for use in other pages
  async getOverallAccountSummary() {
    try {
      // Get all invoices summary with amount_paid field
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('payment_status, total_amount, amount_paid, invoice_date');

      if (invoicesError) throw invoicesError;

      // Get all payments summary
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_type');

      if (paymentsError) throw paymentsError;

      // Calculate summaries
      const totalInvoiced = invoicesData?.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0) || 0;
      
      // Calculate total paid - full amount for 'paid' invoices + amount_paid for 'partial' invoices
      const totalPaid = invoicesData?.reduce((sum, inv) => {
        if (inv.payment_status === 'paid') {
          return sum + parseFloat(inv.total_amount || 0);
        } else if (inv.payment_status === 'partial') {
          return sum + parseFloat(inv.amount_paid || 0);
        }
        return sum;
      }, 0) || 0;
      
      // Calculate total pending - full amount for 'pending' invoices + remaining balance for 'partial' invoices
      const totalPending = invoicesData?.reduce((sum, inv) => {
        if (inv.payment_status === 'pending') {
          return sum + parseFloat(inv.total_amount || 0);
        } else if (inv.payment_status === 'partial') {
          const totalAmount = parseFloat(inv.total_amount || 0);
          const amountPaid = parseFloat(inv.amount_paid || 0);
          const remainingBalance = totalAmount - amountPaid;
          return sum + remainingBalance;
        }
        return sum;
      }, 0) || 0;
      
      const totalReceived = paymentsData?.filter(pay => pay.payment_type === 'received')
        .reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0) || 0;

      // Get detailed breakdown
      const pendingInvoices = invoicesData?.filter(inv => inv.payment_status === 'pending') || [];
      const partialInvoices = invoicesData?.filter(inv => inv.payment_status === 'partial') || [];
      const paidInvoices = invoicesData?.filter(inv => inv.payment_status === 'paid') || [];
      
      // Calculate partial payment details
      const partialPaymentDetails = partialInvoices.map(inv => ({
        invoice_id: inv.id,
        total_amount: parseFloat(inv.total_amount || 0),
        amount_paid: parseFloat(inv.amount_paid || 0),
        remaining_balance: parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0)
      }));

      return {
        totalInvoiced,
        totalPaid,
        totalPending,
        totalReceived,
        accountsReceivable: totalPending,
        breakdown: {
          pendingInvoices: pendingInvoices.length,
          partialInvoices: partialInvoices.length,
          paidInvoices: paidInvoices.length,
          partialPaymentDetails
        }
      };
    } catch (error) {
      console.error('Error fetching overall account summary:', error);
      throw error;
    }
  }
};

// Export utility function for getting account summary that can be used in other pages
export const getAccountSummary = async (options = {}) => {
  const { includeDetails = false, timePeriod = 'all' } = options;
  
  if (timePeriod === 'last30days') {
    return await billingAccountsIntegration.getBillingAccountSummary();
  } else {
    return await billingAccountsIntegration.getOverallAccountSummary();
  }
};

// Export utility function for getting pending amounts breakdown
export const getPendingAmountsBreakdown = async () => {
  try {
    const { data: invoicesData, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, total_amount, amount_paid, payment_status, invoice_date, customers(name)')
      .in('payment_status', ['pending', 'partial']);

    if (error) throw error;

    const pendingInvoices = invoicesData?.filter(inv => inv.payment_status === 'pending') || [];
    const partialInvoices = invoicesData?.filter(inv => inv.payment_status === 'partial') || [];
    
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
    const partialTotal = partialInvoices.reduce((sum, inv) => {
      const totalAmount = parseFloat(inv.total_amount || 0);
      const amountPaid = parseFloat(inv.amount_paid || 0);
      return sum + (totalAmount - amountPaid);
    }, 0);

    return {
      pendingInvoices: pendingInvoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customers?.name || 'Unknown',
        total_amount: parseFloat(inv.total_amount || 0),
        pending_amount: parseFloat(inv.total_amount || 0),
        invoice_date: inv.invoice_date
      })),
      partialInvoices: partialInvoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        customer_name: inv.customers?.name || 'Unknown',
        total_amount: parseFloat(inv.total_amount || 0),
        amount_paid: parseFloat(inv.amount_paid || 0),
        pending_amount: parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0),
        invoice_date: inv.invoice_date
      })),
      totals: {
        pendingTotal,
        partialTotal,
        totalPending: pendingTotal + partialTotal
      }
    };
  } catch (error) {
    console.error('Error fetching pending amounts breakdown:', error);
    throw error;
  }
};
