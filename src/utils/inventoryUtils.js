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

/**
 * Gets all warehouses with optional filtering
 * 
 * @param {Object} options - Filter options
 * @param {boolean} options.activeOnly - Filter for active warehouses only
 * @param {string} options.sortBy - Field to sort by (name, location, created_at)
 * @param {boolean} options.ascending - Sort direction
 * @returns {Promise<Object>} - Warehouses data
 */
export const getWarehouses = async (options = {}) => {
  try {
    let query = supabase
      .from('warehouses')
      .select('*');
    
    // Apply filters
    if (options.activeOnly) {
      query = query.eq('is_active', true);
    }
    
    // Apply sorting
    const sortBy = options.sortBy || 'name';
    const ascending = options.ascending !== false; // Default to true
    query = query.order(sortBy, { ascending });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return { data: [], error };
  }
};

/**
 * Gets inventory for a specific warehouse
 * 
 * @param {string} warehouseId - Warehouse ID
 * @returns {Promise<Object>} - Warehouse inventory data
 */
export const getWarehouseInventory = async (warehouseId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (
          id, attribute_name, value, price_adjustment, stock, sku
        )
      `)
      .eq('warehouse_id', warehouseId);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    return { data: [], error };
  }
};

/**
 * Transfers stock between warehouses
 * 
 * @param {string} productId - Product ID
 * @param {string} sourceWarehouseId - Source warehouse ID
 * @param {string} targetWarehouseId - Target warehouse ID
 * @param {number} quantity - Quantity to transfer
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} - Transfer result
 */
export const transferBetweenWarehouses = async (productId, sourceWarehouseId, targetWarehouseId, quantity, notes = '') => {
  try {
    // First, get the source product to check available quantity
    const { data: sourceProduct, error: sourceError } = await supabase
      .from('products')
      .select('quantity, name')
      .eq('id', productId)
      .eq('warehouse_id', sourceWarehouseId)
      .single();
    
    if (sourceError) throw sourceError;
    if (!sourceProduct) throw new Error('Product not found in source warehouse');
    if (sourceProduct.quantity < quantity) {
      throw new Error(`Not enough stock available. Available: ${sourceProduct.quantity}, Requested: ${quantity}`);
    }
    
    // Check if product exists in target warehouse
    const { data: targetProduct, error: targetError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .eq('warehouse_id', targetWarehouseId)
      .single();
    
    // If product doesn't exist in target warehouse, create it
    if (targetError && targetError.code === 'PGRST116') {
      // Product doesn't exist in target warehouse, create a copy
      const { data: originalProduct, error: originalError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (originalError) throw originalError;
      
      const { error: insertError } = await supabase
        .from('products')
        .insert([{
          ...originalProduct,
          id: undefined, // Let database generate new ID
          warehouse_id: targetWarehouseId,
          quantity: quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (insertError) throw insertError;
    } else if (targetError) {
      throw targetError;
    } else {
      // Product exists in target warehouse, update quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: targetProduct.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('warehouse_id', targetWarehouseId);
      
      if (updateError) throw updateError;
    }
    
    // Update source product quantity
    const { error: sourceUpdateError } = await supabase
      .from('products')
      .update({
        quantity: sourceProduct.quantity - quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('warehouse_id', sourceWarehouseId);
    
    if (sourceUpdateError) throw sourceUpdateError;
    
    // Record stock movement
    const { data: movement, error: movementError } = await supabase
      .from('stock_movements')
      .insert([{
        product_id: productId,
        quantity: quantity,
        movement_type: 'transfer',
        reference_number: `TRANSFER-${Date.now()}`,
        notes: notes || `Transfer from warehouse ${sourceWarehouseId} to ${targetWarehouseId}`,
        source_warehouse_id: sourceWarehouseId,
        target_warehouse_id: targetWarehouseId,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (movementError) throw movementError;
    
    return { data: movement, error: null };
  } catch (error) {
    console.error('Error transferring between warehouses:', error);
    return { data: null, error };
  }
};

/**
 * Gets stock movements for a warehouse
 * 
 * @param {string} warehouseId - Warehouse ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit number of results
 * @returns {Promise<Object>} - Stock movements data
 */
export const getWarehouseStockMovements = async (warehouseId, options = {}) => {
  try {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products:product_id (name, sku)
      `)
      .or(`source_warehouse_id.eq.${warehouseId},target_warehouse_id.eq.${warehouseId}`)
      .order('created_at', { ascending: false });
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching warehouse stock movements:', error);
    return { data: [], error };
  }
};
