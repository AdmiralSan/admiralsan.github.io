import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a product image to Supabase Storage
 * 
 * @param {File} file - The image file to upload
 * @param {string} productId - The product ID the image belongs to
 * @returns {Promise<Object>} - Object containing the uploaded file path and URL
 */
export const uploadProductImage = async (file, productId) => {
  try {
    if (!file || !productId) {
      throw new Error('File and product ID are required');
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return { 
      path: filePath, 
      url: publicUrl, 
      error: null 
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { path: null, url: null, error };
  }
};

/**
 * Removes a product image from Supabase Storage
 * 
 * @param {string} filePath - The file path in storage
 * @returns {Promise<Object>} - Result of the deletion operation
 */
export const removeProductImage = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .remove([filePath]);

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error removing image:', error);
    return { data: null, error };
  }
};

/**
 * Gets a list of all images for a product
 * 
 * @param {string} productId - The product ID
 * @returns {Promise<Array>} - Array of image objects
 */
export const getProductImages = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching product images:', error);
    return { data: [], error };
  }
};
