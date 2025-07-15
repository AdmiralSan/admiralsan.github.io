import { supabase } from '../supabaseClient';

/**
 * Seeds the database with initial data
 * Only use this function for development purposes
 */
export const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  try {
    // Seed suppliers
    const suppliers = [
      { 
        name: 'Tech Supplies Inc.', 
        email: 'contact@techsupplies.com', 
        phone: '555-1234', 
        address: '123 Tech St, San Francisco, CA', 
        contact_person: 'John Smith' 
      },
      { 
        name: 'Global Electronics', 
        email: 'info@globalelectronics.com', 
        phone: '555-5678', 
        address: '456 Global Ave, New York, NY', 
        contact_person: 'Sarah Johnson' 
      },
      { 
        name: 'Food Distributors Ltd.', 
        email: 'orders@fooddist.com', 
        phone: '555-9012', 
        address: '789 Food Blvd, Chicago, IL', 
        contact_person: 'Michael Brown' 
      }
    ];
    
    console.log('Inserting suppliers...');
    const { data: insertedSuppliers, error: supplierError } = await supabase
      .from('suppliers')
      .upsert(suppliers, { onConflict: 'name' })
      .select();
      
    if (supplierError) {
      throw new Error(`Error inserting suppliers: ${supplierError.message}`);
    }
    
    console.log(`${insertedSuppliers.length} suppliers inserted or updated`);
    
    // Get the supplier IDs for referencing in products
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('id, name');
      
    const supplierMap = {};
    supplierData.forEach(supplier => {
      supplierMap[supplier.name] = supplier.id;
    });
    
    // Seed products
    const products = [
      { 
        name: 'Smartphone X', 
        sku: 'PHONE-X', 
        description: 'Latest smartphone model with high-end features', 
        price: 999.99, 
        quantity: 50, 
        category: 'electronics', 
        supplier_id: supplierMap['Global Electronics'],
        reorder_level: 10
      },
      { 
        name: 'Laptop Pro', 
        sku: 'LAP-PRO', 
        description: '15-inch professional laptop with 16GB RAM', 
        price: 1299.99, 
        quantity: 25, 
        category: 'electronics', 
        supplier_id: supplierMap['Tech Supplies Inc.'],
        reorder_level: 5
      },
      { 
        name: 'Organic Apples', 
        sku: 'APPLE-ORG', 
        description: 'Fresh organic apples, 1kg pack', 
        price: 3.99, 
        quantity: 100, 
        category: 'food', 
        supplier_id: supplierMap['Food Distributors Ltd.'],
        reorder_level: 20,
        is_perishable: true,
        has_expiry: true
      },
      { 
        name: 'Cotton T-Shirt', 
        sku: 'SHIRT-COTTON', 
        description: '100% organic cotton t-shirt', 
        price: 19.99, 
        quantity: 200, 
        category: 'clothing', 
        supplier_id: supplierMap['Tech Supplies Inc.'],
        reorder_level: 30
      },
      { 
        name: 'Wooden Chair', 
        sku: 'CHAIR-WOOD', 
        description: 'Handcrafted wooden dining chair', 
        price: 149.99, 
        quantity: 15, 
        category: 'furniture', 
        supplier_id: supplierMap['Food Distributors Ltd.'],
        reorder_level: 5
      }
    ];
    
    console.log('Inserting products...');
    const { data: insertedProducts, error: productError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'sku' })
      .select();
      
    if (productError) {
      throw new Error(`Error inserting products: ${productError.message}`);
    }
    
    console.log(`${insertedProducts.length} products inserted or updated`);
    
    // Get product IDs for variants
    const { data: productData } = await supabase
      .from('products')
      .select('id, name, sku');
      
    const productMap = {};
    productData.forEach(product => {
      productMap[product.sku] = product.id;
    });
    
    // Seed product variants
    const variants = [
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Size',
        value: 'S',
        sku: 'SHIRT-COTTON-S',
        price_adjustment: 0,
        stock: 50
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Size',
        value: 'M',
        sku: 'SHIRT-COTTON-M',
        price_adjustment: 0,
        stock: 70
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Size',
        value: 'L',
        sku: 'SHIRT-COTTON-L',
        price_adjustment: 0,
        stock: 50
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Size',
        value: 'XL',
        sku: 'SHIRT-COTTON-XL',
        price_adjustment: 2,
        stock: 30
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Color',
        value: 'White',
        sku: 'SHIRT-COTTON-WHITE',
        price_adjustment: 0,
        stock: 70
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Color',
        value: 'Black',
        sku: 'SHIRT-COTTON-BLACK',
        price_adjustment: 0,
        stock: 60
      },
      {
        product_id: productMap['SHIRT-COTTON'],
        attribute_name: 'Color',
        value: 'Blue',
        sku: 'SHIRT-COTTON-BLUE',
        price_adjustment: 0,
        stock: 70
      },
      {
        product_id: productMap['LAPTOP-PRO'],
        attribute_name: 'RAM',
        value: '16GB',
        sku: 'LAP-PRO-16GB',
        price_adjustment: 0,
        stock: 15
      },
      {
        product_id: productMap['LAPTOP-PRO'],
        attribute_name: 'RAM',
        value: '32GB',
        sku: 'LAP-PRO-32GB',
        price_adjustment: 200,
        stock: 10
      },
      {
        product_id: productMap['CHAIR-WOOD'],
        attribute_name: 'Color',
        value: 'Natural',
        sku: 'CHAIR-WOOD-NAT',
        price_adjustment: 0,
        stock: 5
      },
      {
        product_id: productMap['CHAIR-WOOD'],
        attribute_name: 'Color',
        value: 'Walnut',
        sku: 'CHAIR-WOOD-WAL',
        price_adjustment: 10,
        stock: 5
      },
      {
        product_id: productMap['CHAIR-WOOD'],
        attribute_name: 'Color',
        value: 'Mahogany',
        sku: 'CHAIR-WOOD-MAH',
        price_adjustment: 15,
        stock: 5
      }
    ];
    
    console.log('Inserting product variants...');
    const { data: insertedVariants, error: variantError } = await supabase
      .from('product_variants')
      .upsert(variants, { onConflict: ['product_id', 'attribute_name', 'value'] })
      .select();
      
    if (variantError) {
      throw new Error(`Error inserting variants: ${variantError.message}`);
    }
    
    console.log(`${insertedVariants.length} variants inserted or updated`);
    
    // Seed stock movements
    const stockMovements = [
      {
        product_id: productMap['PHONE-X'],
        quantity: 50,
        movement_type: 'incoming',
        reference_number: 'INIT-001',
        notes: 'Initial inventory'
      },
      {
        product_id: productMap['LAPTOP-PRO'],
        quantity: 25,
        movement_type: 'incoming',
        reference_number: 'INIT-002',
        notes: 'Initial inventory'
      },
      {
        product_id: productMap['APPLE-ORG'],
        quantity: 100,
        movement_type: 'incoming',
        reference_number: 'INIT-003',
        notes: 'Initial inventory'
      },
      {
        product_id: productMap['PHONE-X'],
        quantity: 5,
        movement_type: 'outgoing',
        reference_number: 'SALE-001',
        notes: 'Sold to customer'
      },
      {
        product_id: productMap['LAPTOP-PRO'],
        quantity: 2,
        movement_type: 'outgoing',
        reference_number: 'SALE-002',
        notes: 'Sold to customer'
      }
    ];
    
    console.log('Inserting stock movements...');
    const { data: insertedMovements, error: movementError } = await supabase
      .from('stock_movements')
      .insert(stockMovements)
      .select();
      
    if (movementError) {
      throw new Error(`Error inserting stock movements: ${movementError.message}`);
    }
    
    console.log(`${insertedMovements.length} stock movements inserted`);
    
    // Seed product batches for perishable products
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const next3Months = new Date(today);
    next3Months.setMonth(today.getMonth() + 3);
    
    const batches = [
      {
        product_id: productMap['APPLE-ORG'],
        batch_number: 'BATCH-APPLE-001',
        quantity: 50,
        manufacturing_date: today.toISOString().split('T')[0],
        expiry_date: nextWeek.toISOString().split('T')[0]
      },
      {
        product_id: productMap['APPLE-ORG'],
        batch_number: 'BATCH-APPLE-002',
        quantity: 50,
        manufacturing_date: today.toISOString().split('T')[0],
        expiry_date: nextMonth.toISOString().split('T')[0]
      }
    ];
    
    console.log('Inserting product batches...');
    const { data: insertedBatches, error: batchError } = await supabase
      .from('product_batches')
      .upsert(batches, { onConflict: 'batch_number' })
      .select();
      
    if (batchError) {
      throw new Error(`Error inserting product batches: ${batchError.message}`);
    }
    
    console.log(`${insertedBatches.length} product batches inserted or updated`);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Function to clear all data (CAUTION: use only in development)
export const clearDatabase = async () => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('This function can only be called in development environment!');
  }
  
  console.log('Clearing database...');
  
  try {
    // Delete in order to respect foreign key constraints
    await supabase.from('order_items').delete().gte('id', 0);
    await supabase.from('purchase_orders').delete().gte('id', 0);
    await supabase.from('product_batches').delete().gte('id', 0);
    await supabase.from('stock_movements').delete().gte('id', 0);
    await supabase.from('product_images').delete().gte('id', 0);
    await supabase.from('product_variants').delete().gte('id', 0);
    await supabase.from('products').delete().gte('id', 0);
    await supabase.from('suppliers').delete().gte('id', 0);
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Example usage (uncomment to use)
// async function main() {
//   await clearDatabase();
//   await seedDatabase();
// }
// main().catch(console.error);
