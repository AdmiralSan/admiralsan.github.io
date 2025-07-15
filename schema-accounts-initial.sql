-- Create initial chart of accounts and accounts for new users
-- This script should be run once after the schema is created

-- Insert default chart of accounts structure
INSERT INTO chart_of_accounts (account_code, account_name, account_type, parent_account, description) 
VALUES 
  ('1000', 'Assets', 'asset', null, 'All company assets'),
  ('1100', 'Current Assets', 'asset', '1000', 'Assets that can be converted to cash within one year'),
  ('1110', 'Cash and Cash Equivalents', 'asset', '1100', 'Cash, checking, and savings accounts'),
  ('1120', 'Accounts Receivable', 'asset', '1100', 'Money owed by customers'),
  ('1130', 'Inventory', 'asset', '1100', 'Goods for sale'),
  ('1200', 'Fixed Assets', 'asset', '1000', 'Long-term assets'),
  ('1210', 'Equipment', 'asset', '1200', 'Office and business equipment'),
  ('1220', 'Accumulated Depreciation', 'asset', '1200', 'Depreciation of fixed assets'),
  
  ('2000', 'Liabilities', 'liability', null, 'All company liabilities'),
  ('2100', 'Current Liabilities', 'liability', '2000', 'Debts due within one year'),
  ('2110', 'Accounts Payable', 'liability', '2100', 'Money owed to suppliers'),
  ('2120', 'Accrued Expenses', 'liability', '2100', 'Expenses incurred but not yet paid'),
  ('2200', 'Long-term Liabilities', 'liability', '2000', 'Debts due after one year'),
  
  ('3000', 'Equity', 'equity', null, 'Owner equity'),
  ('3100', 'Owner Equity', 'equity', '3000', 'Owner investment and retained earnings'),
  ('3110', 'Capital', 'equity', '3100', 'Initial investment'),
  ('3120', 'Retained Earnings', 'equity', '3100', 'Accumulated profits'),
  
  ('4000', 'Revenue', 'revenue', null, 'All company income'),
  ('4100', 'Sales Revenue', 'revenue', '4000', 'Income from sales'),
  ('4110', 'Product Sales', 'revenue', '4100', 'Revenue from product sales'),
  ('4120', 'Service Revenue', 'revenue', '4100', 'Revenue from services'),
  ('4200', 'Other Income', 'revenue', '4000', 'Non-operating income'),
  ('4210', 'Interest Income', 'revenue', '4200', 'Interest earned on investments'),
  
  ('5000', 'Expenses', 'expense', null, 'All company expenses'),
  ('5100', 'Cost of Goods Sold', 'expense', '5000', 'Direct costs of producing goods'),
  ('5110', 'Inventory Costs', 'expense', '5100', 'Cost of inventory sold'),
  ('5200', 'Operating Expenses', 'expense', '5000', 'Day-to-day operating costs'),
  ('5210', 'Rent Expense', 'expense', '5200', 'Office and facility rent'),
  ('5220', 'Utilities Expense', 'expense', '5200', 'Electricity, water, internet'),
  ('5230', 'Office Supplies', 'expense', '5200', 'Paper, pens, office materials'),
  ('5240', 'Marketing Expense', 'expense', '5200', 'Advertising and promotion costs'),
  ('5250', 'Professional Services', 'expense', '5200', 'Legal, accounting, consulting'),
  ('5260', 'Travel Expense', 'expense', '5200', 'Business travel costs'),
  ('5270', 'Maintenance Expense', 'expense', '5200', 'Equipment and facility maintenance');

-- Example function to create default accounts for a new user
-- This would be called when a user first accesses the accounts system
CREATE OR REPLACE FUNCTION create_default_accounts_for_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Create basic accounts for new user
  INSERT INTO accounts (account_name, account_type, current_balance, currency, created_by)
  VALUES 
    ('Main Cash Account', 'cash', 0, 'USD', user_id),
    ('Business Checking', 'bank', 0, 'USD', user_id),
    ('Petty Cash', 'cash', 0, 'USD', user_id),
    ('Savings Account', 'bank', 0, 'USD', user_id);
END;
$$ LANGUAGE plpgsql;

-- Usage example (uncomment to use):
-- SELECT create_default_accounts_for_user('user-uuid-here');
