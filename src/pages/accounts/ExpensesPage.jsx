import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import { expensesAPI } from '../../utils/accountsAPI';

const ExpensesPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateRange, setDateRange] = useState('this_month');
  const [newExpense, setNewExpense] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: 'office_supplies',
    vendor_name: '',
    reference_number: '',
    notes: '',
    payment_method: 'cash'
  });

  const expenseCategories = [
    { value: 'office_supplies', label: 'Office Supplies', color: 'bg-blue-100 text-blue-800' },
    { value: 'rent', label: 'Rent & Utilities', color: 'bg-purple-100 text-purple-800' },
    { value: 'inventory', label: 'Inventory Purchase', color: 'bg-green-100 text-green-800' },
    { value: 'marketing', label: 'Marketing & Advertising', color: 'bg-pink-100 text-pink-800' },
    { value: 'travel', label: 'Travel & Transportation', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'maintenance', label: 'Maintenance & Repairs', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'professional_services', label: 'Professional Services', color: 'bg-red-100 text-red-800' },
    { value: 'insurance', label: 'Insurance', color: 'bg-teal-100 text-teal-800' },
    { value: 'taxes', label: 'Taxes & Fees', color: 'bg-orange-100 text-orange-800' },
    { value: 'other', label: 'Other Expenses', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Fetch real expenses data
      const expensesData = await expensesAPI.getExpenses();
      setExpenses(expensesData);
      
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (categoryValue) => {
    return expenseCategories.find(cat => cat.value === categoryValue) || 
           { label: categoryValue, color: 'bg-gray-100 text-gray-800' };
  };

  const getExpensesByCategory = () => {
    const categoryTotals = {};
    expenses.forEach(expense => {
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += parseFloat(expense.amount);
    });
    return categoryTotals;
  };

  const filteredExpenses = expenses.filter(expense => {
    return selectedCategory === 'all' || expense.category === selectedCategory;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const categoryTotals = getExpensesByCategory();

  const handleAddExpense = async (e) => {
    e.preventDefault();
    
    try {
      // Create expense using API
      const expenseData = await expensesAPI.createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount)
      });
      
      setExpenses([expenseData, ...expenses]);
      
      setNewExpense({
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        category: 'office_supplies',
        vendor_name: '',
        reference_number: '',
        notes: '',
        payment_method: 'cash'
      });
      
      setShowAddExpenseModal(false);
      
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Expenses Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track and categorize your business expenses
          </p>
        </div>
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Add Expense
        </button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="text-3xl">💸</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredExpenses.length}
              </p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average per Transaction</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Expenses by Category
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map(category => {
            const amount = categoryTotals[category.value] || 0;
            return (
              <div key={category.value} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${category.color}`}>
                      {category.label}
                    </span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              {expenseCategories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Expenses List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Expenses
        </h3>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No expenses found. Add your first expense to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => {
              const categoryInfo = getCategoryInfo(expense.category);
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-12 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryInfo.color}`}>
                          {categoryInfo.label}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.vendor_name} • {new Date(expense.expense_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {expense.paymentMethod.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-90vh overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Expense
            </h3>
            
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter expense description..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {expenseCategories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={newExpense.vendor_name}
                  onChange={(e) => setNewExpense({...newExpense, vendor_name: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter vendor name..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={newExpense.paymentMethod}
                  onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_payment">Mobile Payment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={newExpense.reference_number}
                  onChange={(e) => setNewExpense({...newExpense, reference_number: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Receipt #, PO #, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({...newExpense, notes: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
