import { supabase } from '../supabaseClient';
import { recordStockMovement } from './stockMovementUtil';

/**
 * Fetches all warehouses
 * 
 * @param {Object} options - Query options
 * @param {boolean} options.activeOnly - If true, returns only active warehouses
 * @param {string} options.sortBy - Field to sort by
 * @param {boolean} options.ascending - Sort direction
 * @returns {Promise<Object>} - Object containing warehouses data or error
 */
export const getWarehouses = async (options = {}) => {
  try {
    let query = supabase.from('warehouses').select('*');
    
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
    console.error('Error fetching warehouses:', error);
    return { data: [], error };
  }
};

/**
 * Creates a new warehouse
 * 
 * @param {Object} warehouseData - Warehouse data
 * @returns {Promise<Object>} - Result of warehouse creation
 */
export const createWarehouse = async (warehouseData) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([warehouseData])
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating warehouse:', error);
    return { data: null, error };
  }
};

/**
 * Updates an existing warehouse
 * 
 * @param {string} warehouseId - Warehouse ID
 * @param {Object} warehouseData - Updated warehouse data
 * @returns {Promise<Object>} - Result of warehouse update
 */
export const updateWarehouse = async (warehouseId, warehouseData) => {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .update(warehouseData)
      .eq('id', warehouseId)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating warehouse:', error);
    return { data: null, error };
  }
};

/**
 * Deletes a warehouse
 * 
 * @param {string} warehouseId - Warehouse ID
 * @returns {Promise<Object>} - Result of warehouse deletion
 */
export const deleteWarehouse = async (warehouseId) => {
  try {
    // Check if warehouse has products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('warehouse_id', warehouseId);
    
    if (productsError) throw productsError;
    
    if (products && products.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete warehouse with associated products. Please transfer or remove the products first.' } 
      };
    }
    
    // Check if warehouse has variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('warehouse_id', warehouseId);
    
    if (variantsError) throw variantsError;
    
    if (variants && variants.length > 0) {
      return { 
        data: null, 
        error: { message: 'Cannot delete warehouse with associated product variants. Please transfer or remove the variants first.' } 
      };
    }
    
    const { data, error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', warehouseId);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return { data: null, error };
  }
};

/**
 * Gets warehouse inventory summary
 * 
 * @param {string} warehouseId - Warehouse ID
 * @returns {Promise<Object>} - Warehouse inventory summary
 */
export const getWarehouseInventory = async (warehouseId) => {
  try {
    // Get products in warehouse
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('warehouse_id', warehouseId);
    
    if (productsError) throw productsError;
    
    // Get product variants in warehouse
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        products:product_id (
          name,
          sku,
          category
        )
      `)
      .eq('warehouse_id', warehouseId);
    
    if (variantsError) throw variantsError;
    
    // Get product batches in warehouse
    const { data: batches, error: batchesError } = await supabase
      .from('product_batches')
      .select(`
        *,
        products:product_id (
          name,
          sku,
          category
        )
      `)
      .eq('warehouse_id', warehouseId);
    
    if (batchesError) throw batchesError;
    
    // Calculate summary statistics
    const totalProducts = products.length;
    const totalVariants = variants.length;
    const totalBatches = batches.length;
    const productStock = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
    const variantStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
    
    // Group products by category for better reporting
    const categorySummary = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          stock: 0
        };
      }
      acc[category].count += 1;
      acc[category].stock += (product.quantity || 0);
      
      return acc;
    }, {});
    
    // Add variant stock to category summary
    variants.forEach(variant => {
      const category = variant.products?.category || 'Uncategorized';
      if (!categorySummary[category]) {
        categorySummary[category] = {
          count: 0,
          stock: 0
        };
      }
      categorySummary[category].stock += (variant.stock || 0);
    });
    
    return {
      summary: {
        totalProducts,
        totalVariants,
        totalBatches,
        totalStock: productStock + variantStock,
        productStock,
        variantStock
      },
      categories: categorySummary,
      products,
      variants,
      batches,
      error: null
    };
  } catch (error) {
    console.error('Error getting warehouse inventory:', error);
    return { 
      summary: {},
      categories: {},
      products: [],
      variants: [],
      batches: [],
      error
    };
  }
};

/**
 * Transfers products between warehouses
 * 
 * @param {Object} transferData - Transfer data
 * @param {string} transferData.productId - Product ID
 * @param {string} transferData.variantId - Variant ID (optional)
 * @param {number} transferData.quantity - Quantity to transfer
 * @param {string} transferData.sourceWarehouseId - Source warehouse ID
 * @param {string} transferData.targetWarehouseId - Target warehouse ID
 * @param {string} transferData.notes - Notes about the transfer (optional)
 * @param {string} transferData.referenceNumber - Reference number (optional)
 * @returns {Promise<Object>} - Result of the transfer operation
 */
export const transferBetweenWarehouses = async (transferData) => {
  try {
    // Call the database function to handle the transfer
    const { data, error } = await supabase.rpc('transfer_between_warehouses', {
      p_product_id: transferData.productId,
      p_variant_id: transferData.variantId || null,
      p_quantity: transferData.quantity,
      p_source_warehouse_id: transferData.sourceWarehouseId,
      p_target_warehouse_id: transferData.targetWarehouseId,
      p_notes: transferData.notes || 'Warehouse transfer',
      p_reference_number: transferData.referenceNumber || `TRANSFER-${Date.now()}`,
      p_user_id: null // No user ID required now
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error transferring between warehouses:', error);
    return { data: null, error };
  }
};

/**
 * Gets stock movements for a specific warehouse
 * 
 * @param {string} warehouseId - Warehouse ID
 * @param {Object} options - Query options
 * @param {string} options.sortBy - Field to sort by (default: created_at)
 * @param {boolean} options.ascending - Sort direction (default: false - newest first)
 * @param {number} options.limit - Max number of results to return
 * @returns {Promise<Object>} - Stock movements data
 */
export const getWarehouseStockMovements = async (warehouseId, options = {}) => {
  try {
    let query = supabase
      .from('stock_movements')
      .select(`
        *,
        products:product_id (name, sku),
        variants:variant_id (attribute_name, value),
        source_warehouse:source_warehouse_id (name),
        target_warehouse:target_warehouse_id (name)
      `)
      .or(`source_warehouse_id.eq.${warehouseId},target_warehouse_id.eq.${warehouseId}`);
    
    // Apply sorting
    if (options.sortBy) {
      query = query.order(options.sortBy, { ascending: options.ascending !== false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply limit
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

/**
 * Sets the warehouse for a product during creation or update
 * 
 * @param {string} productId - Product ID
 * @param {string} warehouseId - Warehouse ID
 * @returns {Promise<Object>} - Result of the update operation
 */
export const setProductWarehouse = async (productId, warehouseId) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ warehouse_id: warehouseId })
      .eq('id', productId)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error setting product warehouse:', error);
    return { data: null, error };
  }
};

/**
 * Sets the warehouse for a product variant
 * 
 * @param {string} variantId - Variant ID
 * @param {string} warehouseId - Warehouse ID
 * @returns {Promise<Object>} - Result of the update operation
 */
export const setVariantWarehouse = async (variantId, warehouseId) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({ warehouse_id: warehouseId })
      .eq('id', variantId)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error setting variant warehouse:', error);
    return { data: null, error };
  }
};

/**
 * Gets products across all warehouses with their location information
 * This is useful for inventory reports
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Object>} - Product location data
 */
export const getProductLocations = async (options = {}) => {
  try {
    // Get products with their warehouse info
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category,
        quantity,
        warehouses:warehouse_id (id, name, location)
      `);
    
    if (productsError) throw productsError;
    
    // Get variants with their warehouse info
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        attribute_name,
        value,
        stock,
        products:product_id (name, sku),
        warehouses:warehouse_id (id, name, location)
      `);
    
    if (variantsError) throw variantsError;
    
    // Process and organize data by product
    const productLocations = {};
    
    // Add main products
    products.forEach(product => {
      if (!productLocations[product.id]) {
        productLocations[product.id] = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          totalQuantity: product.quantity || 0,
          locations: product.warehouses ? [
            {
              warehouseId: product.warehouses.id,
              warehouseName: product.warehouses.name,
              warehouseLocation: product.warehouses.location,
              quantity: product.quantity || 0,
              isVariant: false
            }
          ] : [],
          variants: []
        };
      }
    });
    
    // Add variants
    variants.forEach(variant => {
      const productId = variant.product_id;
      
      if (!productLocations[productId]) {
        productLocations[productId] = {
          id: productId,
          name: variant.products?.name || 'Unknown Product',
          sku: variant.products?.sku || 'Unknown SKU',
          category: variant.products?.category || 'Unknown Category',
          totalQuantity: 0,
          locations: [],
          variants: []
        };
      }
      
      productLocations[productId].totalQuantity += (variant.stock || 0);
      productLocations[productId].variants.push({
        id: variant.id,
        attributeName: variant.attribute_name,
        value: variant.value,
        stock: variant.stock || 0,
        warehouseId: variant.warehouses?.id,
        warehouseName: variant.warehouses?.name,
        warehouseLocation: variant.warehouses?.location
      });
    });
    
    return { 
      data: Object.values(productLocations), 
      error: null 
    };
  } catch (error) {
    console.error('Error getting product locations:', error);
    return { data: [], error };
  }
};
