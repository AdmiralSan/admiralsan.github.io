
import { supabase } from '../supabaseClient';

/**
 * Records a stock movement in the database
 *
 * @param {Object} params - The stock movement parameters
 * @param {string} params.productId - The ID of the product
 * @param {number} params.quantity - The quantity changed (positive for incoming, negative for outgoing)
 * @param {string} params.movementType - The type of movement ('incoming', 'outgoing', 'adjustment', 'transfer')
 * @param {string} params.referenceNumber - Optional reference number (e.g., order number, invoice number)
 * @param {string} params.notes - Optional notes about the movement
 * @param {string} params.variantId - Optional variant ID if the movement is for a specific variant
 * @returns {Promise<Object>} - The result of the database insertion
 */
export const recordStockMovement = async ({
  productId,
  quantity,
  movementType,
  referenceNumber = null,
  notes = null,
  variantId = null
}) => {
  try {
    // Ensure quantity is treated correctly based on movement type
    const absQuantity = Math.abs(quantity);
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        variant_id: variantId,
        quantity: absQuantity,
        movement_type: movementType,
        reference_number: referenceNumber,
        notes: notes
      })
      .select();
    
    if (error) {
      console.error('Error recording stock movement:', error);
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Calculates the stock movement type based on quantity change
 * 
 * @param {number} oldQuantity - The previous quantity
 * @param {number} newQuantity - The new quantity
 * @returns {string} - The movement type ('incoming', 'outgoing', or 'adjustment')
 */
export const determineMovementType = (oldQuantity, newQuantity) => {
  const difference = newQuantity - oldQuantity;
  if (difference > 0) return 'incoming';
  if (difference < 0) return 'outgoing';
  return 'adjustment';
};
