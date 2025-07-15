import { supabase } from '../supabaseClient';
import { getInventorySummary, transferBatchStock, addProductBatch } from '../utils/inventoryUtils';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis()
  },
  rpc: jest.fn()
}));

describe('Inventory Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventorySummary', () => {
    test('should return inventory summary data when successful', async () => {
      // Mock Supabase responses
      const mockProductCount = { count: 10 };
      const mockLowStockProducts = [
        { id: '1', name: 'Product 1', quantity: 5, reorder_level: 10 },
        { id: '2', name: 'Product 2', quantity: 3, reorder_level: 5 }
      ];
      const mockOutOfStockProducts = [
        { id: '3', name: 'Product 3', quantity: 0, reorder_level: 10 }
      ];
      const mockExpiringProducts = [
        { 
          product_id: '1', 
          expiry_date: '2023-12-31', 
          quantity: 5 
        }
      ];

      // Set up mock implementations
      supabase.from.mockImplementation((table) => {
        if (table === 'products' && supabase.select.mock.calls[0]) {
          return {
            select: jest.fn().mockReturnValue({
              count: jest.fn().mockResolvedValue({ data: mockProductCount, error: null })
            })
          };
        } else if (table === 'products' && supabase.lt.mock.calls[0]) {
          return {
            select: jest.fn().mockReturnThis(),
            lt: jest.fn().mockResolvedValue({ data: mockLowStockProducts, error: null })
          };
        } else if (table === 'products' && supabase.eq.mock.calls[0]) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockOutOfStockProducts, error: null })
          };
        } else if (table === 'product_batches') {
          return {
            select: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            gt: jest.fn().mockResolvedValue({ data: mockExpiringProducts, error: null })
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis()
        };
      });

      // Call the function
      const result = await getInventorySummary();

      // Assertions
      expect(result.error).toBeNull();
      expect(result.totalProducts).toBe(10);
      expect(result.lowStockCount).toBe(2);
      expect(result.outOfStockCount).toBe(1);
      expect(result.expiringBatchesCount).toBe(1);
      expect(result.lowStockProducts).toEqual(mockLowStockProducts);
      expect(result.outOfStockProducts).toEqual(mockOutOfStockProducts);
      expect(result.expiringProducts).toEqual(mockExpiringProducts);
    });

    test('should handle errors', async () => {
      // Mock error response
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gt: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
        };
      });

      // Call the function
      const result = await getInventorySummary();

      // Assertions
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Database error');
    });
  });

  // Add more tests for other functions
});
