-- Test script to verify the accounts system is working
-- Run this after setting up the schema and initial data

-- Test 1: Verify chart of accounts exists
SELECT 'Chart of Accounts Test' as test_name, count(*) as record_count 
FROM chart_of_accounts;

-- Test 2: Create a test user account (replace with actual user ID)
-- SELECT create_default_accounts_for_user('test-user-id');

-- Test 3: Verify accounts table structure
SELECT 'Accounts Table Test' as test_name, count(*) as record_count 
FROM accounts;

-- Test 4: Test ledger entries
INSERT INTO ledger_entries (entry_date, entry_time, description, entry_type, amount, category, reference_number, notes, created_by)
VALUES 
  (CURRENT_DATE, CURRENT_TIME, 'Test Income Entry', 'income', 100.00, 'sales', 'TEST-001', 'Test entry for system verification', 'test-user'),
  (CURRENT_DATE, CURRENT_TIME, 'Test Expense Entry', 'expense', 50.00, 'office_supplies', 'TEST-002', 'Test expense for system verification', 'test-user');

-- Test 5: Verify ledger entries
SELECT 'Ledger Entries Test' as test_name, count(*) as record_count 
FROM ledger_entries;

-- Test 6: Test daily summary view
SELECT 'Daily Summary Test' as test_name, * 
FROM daily_ledger_summary 
WHERE entry_date = CURRENT_DATE;

-- Test 7: Test payments
INSERT INTO payments (payment_date, payment_type, amount, customer_name, reference, payment_method, payment_status, notes, created_by)
VALUES 
  (CURRENT_DATE, 'received', 500.00, 'Test Customer', 'PAY-001', 'cash', 'completed', 'Test payment', 'test-user');

-- Test 8: Verify payments
SELECT 'Payments Test' as test_name, count(*) as record_count 
FROM payments;

-- Test 9: Test expenses
INSERT INTO expenses (expense_date, description, amount, category, vendor, reference, notes, payment_method, created_by)
VALUES 
  (CURRENT_DATE, 'Test Office Supplies', 75.00, 'office_supplies', 'Test Vendor', 'EXP-001', 'Test expense', 'cash', 'test-user');

-- Test 10: Verify expenses
SELECT 'Expenses Test' as test_name, count(*) as record_count 
FROM expenses;

-- Test 11: Test account balances view
SELECT 'Account Balances Test' as test_name, count(*) as record_count 
FROM account_balances_summary;

-- Test 12: Test expense analysis view
SELECT 'Expense Analysis Test' as test_name, count(*) as record_count 
FROM expense_analysis;

-- Clean up test data (uncomment to remove test entries)
-- DELETE FROM ledger_entries WHERE created_by = 'test-user';
-- DELETE FROM payments WHERE created_by = 'test-user';
-- DELETE FROM expenses WHERE created_by = 'test-user';

SELECT 'All tests completed successfully!' as message;
