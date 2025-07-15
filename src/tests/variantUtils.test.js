import { supabase } from '../supabaseClient';
import { getProductVariants, groupVariantsByAttribute, updateVariantStock } from '../utils/variantUtils';

// Mock Supabase client
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis()
  }
}));

describe('Variant Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductVariants', () => {
    test('should return product variants when successful', async () => {
      // Mock Supabase response
      const mockVariants = [
        { id: '1', product_id: 'p1', attribute_name: 'Size', value: 'S', sku: 'P1-S', price_adjustment: 0, stock: 10 },
        { id: '2', product_id: 'p1', attribute_name: 'Size', value: 'M', sku: 'P1-M', price_adjustment: 0, stock: 15 },
        { id: '3', product_id: 'p1', attribute_name: 'Color', value: 'Red', sku: 'P1-RED', price_adjustment: 2, stock: 5 }
      ];

      // Set up mock implementation
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockVariants, error: null })
        };
      });

      // Call the function
      const result = await getProductVariants('p1');

      // Assertions
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockVariants);
      expect(supabase.from).toHaveBeenCalledWith('product_variants');
      expect(supabase.from().select).toHaveBeenCalled();
      expect(supabase.from().select().eq).toHaveBeenCalledWith('product_id', 'p1');
    });

    test('should handle errors', async () => {
      // Mock error response
      supabase.from.mockImplementation(() => {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
        };
      });

      // Call the function
      const result = await getProductVariants('p1');

      // Assertions
      expect(result.data).toEqual([]);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Database error');
    });
  });

  describe('groupVariantsByAttribute', () => {
    test('should correctly group variants by attribute name', () => {
      // Test data
      const variants = [
        { id: '1', product_id: 'p1', attribute_name: 'Size', value: 'S', sku: 'P1-S', price_adjustment: 0, stock: 10 },
        { id: '2', product_id: 'p1', attribute_name: 'Size', value: 'M', sku: 'P1-M', price_adjustment: 0, stock: 15 },
        { id: '3', product_id: 'p1', attribute_name: 'Color', value: 'Red', sku: 'P1-RED', price_adjustment: 2, stock: 5 },
        { id: '4', product_id: 'p1', attribute_name: 'Color', value: 'Blue', sku: 'P1-BLUE', price_adjustment: 1, stock: 8 }
      ];

      // Expected result
      const expected = {
        'Size': [
          { id: '1', value: 'S', sku: 'P1-S', price_adjustment: 0, stock: 10 },
          { id: '2', value: 'M', sku: 'P1-M', price_adjustment: 0, stock: 15 }
        ],
        'Color': [
          { id: '3', value: 'Red', sku: 'P1-RED', price_adjustment: 2, stock: 5 },
          { id: '4', value: 'Blue', sku: 'P1-BLUE', price_adjustment: 1, stock: 8 }
        ]
      };

      // Call the function
      const result = groupVariantsByAttribute(variants);

      // Assertions
      expect(result).toEqual(expected);
    });

    test('should handle empty input', () => {
      // Call the function with empty array
      const result = groupVariantsByAttribute([]);

      // Assertions
      expect(result).toEqual({});
    });
  });

  describe('updateVariantStock', () => {
    test('should update variant stock when successful', async () => {
      // Mock Supabase response
      const mockUpdatedVariant = [
        { id: '1', product_id: 'p1', attribute_name: 'Size', value: 'S', stock: 15 }
      ];

      // Set up mock implementation
      supabase.from.mockImplementation(() => {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({ data: mockUpdatedVariant, error: null })
        };
      });

      // Call the function
      const result = await updateVariantStock('1', 15);

      // Assertions
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockUpdatedVariant);
      expect(supabase.from).toHaveBeenCalledWith('product_variants');
      expect(supabase.from().update).toHaveBeenCalledWith(expect.objectContaining({ stock: 15 }));
      expect(supabase.from().update().eq).toHaveBeenCalledWith('id', '1');
    });

    test('should handle errors', async () => {
      // Mock error response
      supabase.from.mockImplementation(() => {
        return {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
        };
      });

      // Call the function
      const result = await updateVariantStock('1', 15);

      // Assertions
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Database error');
    });
  });
});
