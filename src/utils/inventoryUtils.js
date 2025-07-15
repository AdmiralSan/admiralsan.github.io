import { supabase } from '../supabaseClient';
import { recordStockMovement } from './stockMovementUtil';

/**
 * Gets a summary of current inventory levels
 * 
 * @returns {Promise<Object>} - Inventory summary data
 */
export const getInventorySummary = async () => {
  try {
    // Get total product count and sum of quantities
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, quantity, price, category, name, sku, reorder_level, warehouse_id');
    
    if (productsError) throw productsError;
    
    // Get warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('id, name, location');
      
    if (warehousesError) throw warehousesError;
    
    // Get low stock products (below reorder level)
    const lowStockProducts = products.filter(product => 
      product.quantity > 0 && 
      product.quantity <= (product.reorder_level || 5)
    );
    
    // Get out of stock products
    const outOfStockProducts = products.filter(product => product.quantity <= 0);
    
    // Get products with expiring batches in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: expiringProducts, error: expiringError } = await supabase
      .from('product_batches')
      .select('product_id, expiry_date, quantity')
      .lt('expiry_date', thirtyDaysFromNow.toISOString())
      .gt('quantity', 0);
    
    if (expiringError) throw expiringError;
    
    // Calculate total stock and value
    const totalStock = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
    const totalValue = products.reduce((sum, product) => sum + ((product.quantity || 0) * (product.price || 0)), 0);
    
    // Create warehouse summary
    const warehouseSummary = warehouses.map(warehouse => {
      const warehouseProducts = products.filter(p => p.warehouse_id === warehouse.id);
      return {
        id: warehouse.id,
        name: warehouse.name,
        location: warehouse.location,
        productCount: warehouseProducts.length,
        stockCount: warehouseProducts.reduce((sum, p) => sum + (p.quantity || 0), 0)
      };
    });
    
    // Create category summary
    const categories = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { count: 0, stock: 0, value: 0 };
      }
      categories[category].count++;
      categories[category].stock += (product.quantity || 0);
      categories[category].value += (product.quantity || 0) * (product.price || 0);
    });
    
    return {
      totalProducts: products?.length || 0,
      totalStock,
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      expiringBatchesCount: expiringProducts?.length || 0,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      expiringProducts,
      warehouses: warehouseSummary,
      categories,
      error: null
    };
  } catch (error) {
    console.error('Error getting inventory summary:', error);
    return { error };
  }
};

/**
 * Transfers stock between batches or adjusts batch quantities
 * 
 * @param {string} fromBatchId - Source batch ID
 * @param {string} toBatchId - Destination batch ID (optional)
 * @param {number} quantity - Quantity to transfer
 * @param {string} notes - Optional notes for the transfer
 * @returns {Promise<Object>} - Result of the transfer operation
 */
export const transferBatchStock = async (fromBatchId, toBatchId, quantity, notes) => {
  try {
    // Get source batch details
    const { data: fromBatch, error: fromBatchError } = await supabase
      .from('product_batches')
      .select('*')
      .eq('id', fromBatchId)
      .single();
    
    if (fromBatchError) throw fromBatchError;
    if (fromBatch.quantity < quantity) {
      throw new Error('Not enough stock in source batch');
    }
    
    // Start a transaction
    const { data, error } = await supabase.rpc('transfer_batch_stock', {
      from_batch_id: fromBatchId,
      to_batch_id: toBatchId,
      transfer_quantity: quantity,
      transfer_notes: notes || 'Batch transfer'
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error transferring batch stock:', error);
    return { data: null, error };
  }
};

/**
 * Adds a new batch for a product
 * 
 * @param {Object} batchData - Batch data
 * @returns {Promise<Object>} - Result of the batch creation
 */
export const addProductBatch = async (batchData) => {
  try {
    const { data, error } = await supabase
      .from('product_batches')
      .insert([batchData])
      .select();
    
    if (error) throw error;
    
    // Record a stock movement for this new batch
    await recordStockMovement({
      productId: batchData.product_id,
      quantity: batchData.quantity,
      movementType: 'incoming',
      referenceNumber: batchData.batch_number,
      notes: `New batch added: ${batchData.batch_number}`,
      variantId: batchData.variant_id
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error adding product batch:', error);
    return { data: null, error };
  }
};

/**
 * Gets expiring products within a specified date range
 * 
 * @param {Date} startDate - Start date of the range
 * @param {Date} endDate - End date of the range
 * @returns {Promise<Object>} - Expiring products data
 */
export const getExpiringProducts = async (startDate = new Date(), endDate = null) => {
  try {
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // Default to 30 days from start date
    }
    
    const { data, error } = await supabase
      .from('product_batches')
      .select(`
        *,
        products:product_id (
          name, 
          sku,
          category
        ),
        variants:variant_id (
          attribute_name,
          value
        )
      `)
      .gte('expiry_date', startDate.toISOString().split('T')[0])
      .lte('expiry_date', endDate.toISOString().split('T')[0])
      .gt('quantity', 0);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching expiring products:', error);
    return { data: [], error };
  }
};
