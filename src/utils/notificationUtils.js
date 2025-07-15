import { supabase } from '../supabaseClient';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  ORDER_RECEIVED: 'order_received',
  SYSTEM: 'system'
};

/**
 * Creates a notification in the database
 * 
 * @param {Object} notification - Notification data
 * @param {string} notification.type - Notification type (use NOTIFICATION_TYPES)
 * @param {string} notification.message - Notification message
 * @param {string} notification.resource_type - Resource type (e.g., 'product', 'order')
 * @param {string} notification.resource_id - Resource ID
 * @param {string} notification.user_id - User ID (optional, if null will be sent to all users)
 * @returns {Promise<Object>} - Created notification data
 */
export const createNotification = async (notification) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notification,
        is_read: false,
        created_at: new Date()
      }])
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }
};

/**
 * Gets all unread notifications for the current user
 * 
 * @returns {Promise<Object>} - User's unread notifications
 */
export const getUnreadNotifications = async () => {
  try {
    // No user authentication required
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${dummyUserId},user_id.is.null`)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return { data: [], error };
  }
};

/**
 * Marks notifications as read
 * 
 * @param {string|string[]} notificationIds - ID or array of IDs of notifications to mark as read
 * @returns {Promise<Object>} - Result of the update operation
 */
export const markNotificationsAsRead = async (notificationIds) => {
  try {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return { data: null, error };
  }
};

/**
 * Checks for low stock products and creates notifications
 * 
 * @returns {Promise<Object>} - Result of the check operation
 */
export const checkLowStockProducts = async () => {
  try {
    // Get products with stock below reorder level
    const { data: lowStockProducts, error: lowStockError } = await supabase
      .from('products')
      .select('id, name, quantity, reorder_level')
      .lt('quantity', 'reorder_level')
      .gt('quantity', 0); // Only get products that still have some stock
    
    if (lowStockError) throw lowStockError;
    
    // Get out of stock products
    const { data: outOfStockProducts, error: outOfStockError } = await supabase
      .from('products')
      .select('id, name')
      .eq('quantity', 0);
    
    if (outOfStockError) throw outOfStockError;
    
    // Create notifications for low stock products
    const lowStockNotifications = lowStockProducts.map(product => ({
      type: NOTIFICATION_TYPES.LOW_STOCK,
      message: `Low stock alert: ${product.name} is below reorder level (${product.quantity}/${product.reorder_level})`,
      resource_type: 'product',
      resource_id: product.id
    }));
    
    // Create notifications for out of stock products
    const outOfStockNotifications = outOfStockProducts.map(product => ({
      type: NOTIFICATION_TYPES.OUT_OF_STOCK,
      message: `Out of stock alert: ${product.name} is out of stock`,
      resource_type: 'product',
      resource_id: product.id
    }));
    
    // Combine all notifications
    const allNotifications = [...lowStockNotifications, ...outOfStockNotifications];
    
    // Insert notifications in batches
    if (allNotifications.length > 0) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(allNotifications);
      
      if (error) throw error;
    }
    
    return { 
      success: true, 
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      error: null
    };
  } catch (error) {
    console.error('Error checking low stock products:', error);
    return { success: false, error };
  }
};

/**
 * Checks for expiring products and creates notifications
 * 
 * @param {number} daysThreshold - Days threshold for expiry warning (default: 7)
 * @returns {Promise<Object>} - Result of the check operation
 */
export const checkExpiringProducts = async (daysThreshold = 7) => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysThreshold);
    
    // Get products expiring within the threshold
    const { data: expiringProducts, error } = await supabase
      .from('product_batches')
      .select(`
        *,
        products:product_id (name)
      `)
      .lte('expiry_date', futureDate.toISOString().split('T')[0])
      .gte('expiry_date', today.toISOString().split('T')[0])
      .gt('quantity', 0);
    
    if (error) throw error;
    
    // Create notifications for expiring products
    const expiringNotifications = expiringProducts.map(batch => ({
      type: NOTIFICATION_TYPES.EXPIRING_SOON,
      message: `Expiry alert: ${batch.products?.name || 'Product'} (Batch ${batch.batch_number}) expires on ${new Date(batch.expiry_date).toLocaleDateString()}`,
      resource_type: 'product_batch',
      resource_id: batch.id
    }));
    
    // Insert notifications
    if (expiringNotifications.length > 0) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(expiringNotifications);
      
      if (error) throw error;
    }
    
    return { 
      success: true, 
      expiringCount: expiringProducts.length,
      error: null
    };
  } catch (error) {
    console.error('Error checking expiring products:', error);
    return { success: false, error };
  }
};
