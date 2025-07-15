// pendingInvoicesAPI.js - API for managing pending and partial invoices
import { supabase } from '../supabaseClient';

/**
 * API functions for fetching and managing pending/partial invoices
 * Use these functions to display pending payments across the application
 */
const pendingInvoicesAPI = {
  /**
   * Get all pending invoices for a specific customer
   * @param {string|number} customerId - The customer ID
   * @returns {Promise<Array>} Array of pending and partial invoices
   */
  async getCustomerPendingInvoices(customerId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          )
        `)
        .in('payment_status', ['pending', 'partial'])
        .eq('customer_id', customerId)
        .order('invoice_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer pending invoices:', error);
      throw error;
    }
  },
  
  /**
   * Get all pending invoices across all customers
   * @param {Object} options - Query options
   * @param {number} options.limit - Max number of results to return
   * @param {number} options.offset - Number of results to skip
   * @returns {Promise<Array>} Array of pending and partial invoices
   */
  async getAllPendingInvoices({ limit = 50, offset = 0 } = {}) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email
          )
        `)
        .in('payment_status', ['pending', 'partial'])
        .order('invoice_date', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all pending invoices:', error);
      throw error;
    }
  },
  
  /**
   * Get count of pending and partial invoices
   * @returns {Promise<Object>} Object with counts by status
   */
  async getPendingInvoiceCounts() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('payment_status')
        .in('payment_status', ['pending', 'partial']);
        
      if (error) throw error;
      
      // Calculate counts
      const counts = {
        pending: 0,
        partial: 0,
        total: data?.length || 0
      };
      
      data?.forEach(invoice => {
        if (invoice.payment_status === 'pending') counts.pending++;
        if (invoice.payment_status === 'partial') counts.partial++;
      });
      
      return counts;
    } catch (error) {
      console.error('Error fetching pending invoice counts:', error);
      throw error;
    }
  },
  
  /**
   * Get total pending amount
   * @returns {Promise<number>} Total pending amount across all invoices
   */
  async getTotalPendingAmount() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, amount_paid')
        .in('payment_status', ['pending', 'partial']);
        
      if (error) throw error;
      
      return (data || []).reduce((total, invoice) => {
        const pending = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0);
        return total + pending;
      }, 0);
    } catch (error) {
      console.error('Error calculating total pending amount:', error);
      throw error;
    }
  },
  
  /**
   * Get pending invoice details for a specific invoice
   * @param {string|number} invoiceId - The invoice ID
   * @returns {Promise<Object>} Invoice details with customer information
   */
  async getPendingInvoiceDetails(invoiceId) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, service_id, description, quantity, unit_price, 
            discount_percent, tax_rate, products(name, product_code),
            services(name, service_code)
          )
        `)
        .eq('id', invoiceId)
        .in('payment_status', ['pending', 'partial'])
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching pending invoice details:', error);
      throw error;
    }
  },
  
  /**
   * Get recently paid invoices
   * @param {number} days - Number of days to look back
   * @param {number} limit - Max number of results
   * @returns {Promise<Array>} Recently paid invoices
   */
  async getRecentlyPaidInvoices(days = 30, limit = 5) {
    try {
      const today = new Date();
      const pastDate = new Date(today.setDate(today.getDate() - days));
      
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (id, name)
        `)
        .eq('payment_status', 'paid')
        .gte('updated_at', pastDate.toISOString())
        .order('updated_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recently paid invoices:', error);
      throw error;
    }
  }
};

export default pendingInvoicesAPI;
