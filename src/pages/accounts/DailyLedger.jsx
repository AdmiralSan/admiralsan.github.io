import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@clerk/clerk-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { supabase } from '../../supabaseClient';
import { ledgerAPI } from '../../utils/accountsAPI';

const DailyLedger = () => {
  const { formatCurrency } = useCurrency();
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntries, setDailyEntries] = useState([]);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [newEntry, setNewEntry] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    entry_type: 'income',
    amount: '',
    category: 'sales',
    reference_number: '',
    vendor_customer: '',
    notes: ''
  });

  const incomeCategories = [
    { value: 'sales', label: 'Sales Revenue' },
    { value: 'services', label: 'Service Income' },
    { value: 'interest', label: 'Interest Income' },
    { value: 'other_income', label: 'Other Income' }
  ];

  const expenseCategories = [
    { value: 'office_supplies', label: 'Office Supplies' },
    { value: 'rent', label: 'Rent & Utilities' },
    { value: 'inventory', label: 'Inventory Purchase' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'travel', label: 'Travel' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'professional_services', label: 'Professional Services' },
    { value: 'other_expenses', label: 'Other Expenses' }
  ];

  useEffect(() => {
    fetchDailyEntries();
  }, [selectedDate]);

  const handleDeleteEntry = (entry) => {
    setEntryToDelete(entry);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;

    try {
      await ledgerAPI.deleteLedgerEntry(entryToDelete.id);
      setDailyEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Error deleting entry');
    }
  };

  const fetchDailyEntries = async () => {
    try {
      setLoading(true);
      
      // Fetch real entries for selected date
      const entries = await ledgerAPI.getLedgerEntries({
        date: selectedDate
      });
      
      setDailyEntries(entries);
      
    } catch (error) {
      console.error('Error fetching daily entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Attempting to add entry:', newEntry);
      
      // Create new entry using API
      const newEntryData = await ledgerAPI.createLedgerEntry({
        ...newEntry,
        entry_time: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        amount: parseFloat(newEntry.amount)
      }, userId);
      
      console.log('Entry created successfully:', newEntryData);
      
      // Add to daily entries
      setDailyEntries([...dailyEntries, newEntryData]);
      
      // Reset form
      setNewEntry({
        entry_date: selectedDate,
        description: '',
        entry_type: 'income',
        amount: '',
        category: 'sales',
        reference_number: '',
        vendor_customer: '',
        notes: ''
      });
      
      setShowAddEntryModal(false);
      
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Error adding entry: ' + error.message);
    }
  };

  const getDailyTotals = () => {
    const income = dailyEntries
      .filter(entry => entry.entry_type === 'income')
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    
    const expenses = dailyEntries
      .filter(entry => entry.entry_type === 'expense')
      .reduce((sum, entry) => sum + parseFloat(entry.amount), 0);
    
    return { income, expenses, net: income - expenses };
  };

  const getCategoryLabel = (categoryValue, type) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const totals = getDailyTotals();

  return (
    <div className="space-y-6">
      {/* Header and Date Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Daily Ledger
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track daily income and expenses
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => {
              console.log('Add Entry button clicked');
              setShowAddEntryModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Entry
          </button>
        </div>
      </motion.div>

      {/* Daily Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.income)}
              </p>
            </div>
            <div className="text-3xl">📈</div>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.expenses)}
              </p>
            </div>
            <div className="text-3xl">📉</div>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Amount</p>
              <p className={`text-2xl font-bold ${
                totals.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totals.net)}
              </p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </motion.div>
      </div>

      {/* Daily Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Entries for {new Date(selectedDate).toLocaleDateString()}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : dailyEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No entries found for this date. Add your first entry to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Account</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Reference</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dailyEntries.map((entry) => (
                  <tr key={entry.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.entry_time}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{entry.description}</p>
                        {entry.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">{entry.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.entry_type === 'income' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {entry.entry_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.entry_type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.account_name || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {getCategoryLabel(entry.category, entry.entry_type)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {entry.reference_number || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm">
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add Entry Modal */}
      {showAddEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Entry
            </h3>
            
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newEntry.entry_date}
                  onChange={(e) => setNewEntry({...newEntry, entry_date: e.target.value})}
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
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter description..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newEntry.entry_type}
                    onChange={(e) => setNewEntry({...newEntry, entry_type: e.target.value, category: e.target.value === 'income' ? 'sales' : 'office_supplies'})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({...newEntry, amount: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({...newEntry, category: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {(newEntry.entry_type === 'income' ? incomeCategories : expenseCategories).map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={newEntry.reference_number}
                    onChange={(e) => setNewEntry({...newEntry, reference_number: e.target.value})}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Invoice #, Receipt #, etc."
                  />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({...newEntry, notes: e.target.value})}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEntryModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Add Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setEntryToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEntry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLedger;
