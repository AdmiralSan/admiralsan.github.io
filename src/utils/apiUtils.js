/**
 * Utility functions for making API requests with JWT authentication
 */
import { supabase } from '../supabaseClient';

/**
 * Get a mock JWT token (authentication removed)
 * @returns {Promise<string>} A dummy token
 */
export const getJwtToken = async () => {
  // Return a dummy token since we're not using authentication
  return "dummy_token_no_auth_required";
};

/**
 * Make an authenticated API request using the JWT token
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} The API response
 */
export const authenticatedRequest = async (url, options = {}) => {
  try {
    const token = await getJwtToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // No need to handle 401 errors since we're not using authentication
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Check if the user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export const isAuthenticated = async () => {
  const token = await getJwtToken();
  return !!token;
};

export default {
  getJwtToken,
  authenticatedRequest,
  isAuthenticated
};