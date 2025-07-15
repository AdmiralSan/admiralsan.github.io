import { supabase } from '../supabaseClient';

/**
 * Fetches all variants for a product
 * 
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} - Object containing variants data or error
 */
export const getProductVariants = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .order('attribute_name', { ascending: true });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return { data: [], error };
  }
};

/**
 * Groups variants by attribute name
 * Useful for displaying variants in a structured way
 * 
 * @param {Array} variants - Array of variant objects
 * @returns {Object} - Object with attribute names as keys and arrays of values
 */
export const groupVariantsByAttribute = (variants) => {
  const grouped = {};
  
  variants.forEach(variant => {
    if (!grouped[variant.attribute_name]) {
      grouped[variant.attribute_name] = [];
    }
    
    grouped[variant.attribute_name].push({
      id: variant.id,
      value: variant.value,
      sku: variant.sku,
      price_adjustment: variant.price_adjustment,
      stock: variant.stock
    });
  });
  
  return grouped;
};

/**
 * Updates the stock quantity for a specific variant
 * 
 * @param {string} variantId - The variant ID
 * @param {number} newStock - The new stock quantity
 * @returns {Promise<Object>} - Result of the update operation
 */
export const updateVariantStock = async (variantId, newStock) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .update({ stock: newStock, updated_at: new Date() })
      .eq('id', variantId)
      .select();
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating variant stock:', error);
    return { data: null, error };
  }
};

/**
 * Gets unique attribute names and values used across all products
 * Useful for filtering and search interfaces
 * 
 * @returns {Promise<Object>} - Object with attributes and their unique values
 */
export const getUniqueVariantAttributes = async () => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('attribute_name, value');
    
    if (error) throw error;
    
    const attributes = {};
    data.forEach(item => {
      if (!attributes[item.attribute_name]) {
        attributes[item.attribute_name] = new Set();
      }
      attributes[item.attribute_name].add(item.value);
    });
    
    // Convert sets to arrays
    Object.keys(attributes).forEach(key => {
      attributes[key] = Array.from(attributes[key]);
    });
    
    return { attributes, error: null };
  } catch (error) {
    console.error('Error fetching variant attributes:', error);
    return { attributes: {}, error };
  }
};
