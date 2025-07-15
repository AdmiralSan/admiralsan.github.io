import { supabase } from '../supabaseClient';

/**
 * Fetches all suppliers
 * 
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - If true, returns only active suppliers
 * @param {string} options.sortBy - Field to sort by
 * @param {boolean} options.ascending - Sort direction
 * @returns {Promise<Object>} - Object containing suppliers data or error
 */
export const getSuppliers = async (options = {}) => {
  try {
    let query = supabase.from('suppliers').select('*');
    
    // Apply filters
    if (options.activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // Apply sorting
    if (options.sortBy) {
      query = query.order(options.sortBy, { ascending: options.ascending !== false });
    } else {
      query = query.order('name', { ascending: true });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return { data: [], error };
  }
};

/**
 * Creates a new supplier
 * 
 * @param {Object} supplierData - Supplier data
 * @returns {Promise<Object>} - Result of supplier creation
 */
export const createSupplier = async (supplierData) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplierData])
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating supplier:', error);
    return { data: null, error };
  }
};

/**
 * Updates an existing supplier
 * 
 * @param {string} supplierId - Supplier ID
 * @param {Object} supplierData - Updated supplier data
 * @returns {Promise<Object>} - Result of supplier update
 */
export const updateSupplier = async (supplierId, supplierData) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', supplierId)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { data: null, error };
  }
};

/**
 * Deletes a supplier
 * 
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} - Result of supplier deletion
 */
export const deleteSupplier = async (supplierId) => {
  try {
    // Check if supplier has products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('supplier_id', supplierId);
    
    if (productsError) throw productsError;
    
    if (products && products.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete supplier with associated products' } 
      };
    }
    
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplierId);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { data: null, error };
  }
};

/**
 * Fetches all purchase orders for a specific supplier
 * 
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} - Object containing purchase orders data
 */
export const getSupplierPurchaseOrders = async (supplierId) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        order_items:order_items (
          id,
          product_id,
          variant_id,
          quantity,
          unit_price
        )
      `)
      .eq('supplier_id', supplierId)
      .order('order_date', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching supplier purchase orders:', error);
    return { data: [], error };
  }
};

/**
 * Gets supplier performance metrics
 * 
 * @param {string} supplierId - Supplier ID
 * @returns {Promise<Object>} - Object containing supplier metrics
 */
export const getSupplierMetrics = async (supplierId) => {
  try {
    // Get all purchase orders for the supplier
    const { data: orders, error: ordersError } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        order_date,
        expected_delivery_date,
        status
      `)
      .eq('supplier_id', supplierId);
    
    if (ordersError) throw ordersError;
    
    // Calculate metrics
    const metrics = {
      totalOrders: orders.length,
      onTimeDeliveryRate: 0,
      averageLeadTime: 0,
      cancelledOrders: 0
    };
    
    if (orders.length > 0) {
      // Count completed orders delivered on time
      const completedOrders = orders.filter(o => o.status === 'received');
      const onTimeDeliveries = completedOrders.filter(o => 
        new Date(o.expected_delivery_date) >= new Date(o.order_date)
      );
      
      metrics.onTimeDeliveryRate = completedOrders.length > 0 ? 
        (onTimeDeliveries.length / completedOrders.length * 100) : 0;
      
      // Calculate average lead time (days between order and delivery)
      const leadTimes = completedOrders.map(o => {
        const orderDate = new Date(o.order_date);
        const deliveryDate = new Date(o.delivery_date || o.expected_delivery_date);
        return Math.ceil((deliveryDate - orderDate) / (1000 * 60 * 60 * 24));
      });
      
      metrics.averageLeadTime = leadTimes.length > 0 ?
        leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;
      
      // Count cancelled orders
      metrics.cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    }
    
    return { metrics, error: null };
  } catch (error) {
    console.error('Error calculating supplier metrics:', error);
    return { metrics: null, error };
  }
};
