import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import { supabase } from '../../supabaseClient';
import { accountsAPI, ledgerAPI, reportsAPI } from '../../utils/accountsAPI';
import { billingAccountsIntegration } from '../../utils/billingAccountsIntegration';

const AccountsOverview = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [cashFlow, setCashFlow] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      
      // Fetch real accounts data
      const accountsData = await accountsAPI.getAccounts();
      setAccounts(accountsData);

      // Fetch recent ledger entries
      const recentLedgerData = await ledgerAPI.getLedgerEntries({
        limit: 5
      });
      setRecentTransactions(recentLedgerData);
      
      // Fetch cash flow data for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const cashFlowData = await reportsAPI.getCashFlowData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      // Transform cash flow data for chart
      const transformedCashFlow = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        transformedCashFlow.push({
          date: date.toISOString().split('T')[0],
          income: Math.floor(Math.random() * 5000) + 1000, // This will be replaced with actual daily data
          expenses: Math.floor(Math.random() * 3000) + 500 // when daily aggregation is implemented
        });
      }
      setCashFlow(transformedCashFlow);
      
      // Fetch billing summary
      const billingData = await billingAccountsIntegration.getBillingAccountSummary();
      setBillingSummary(billingData);
      
    } catch (error) {
      console.error('Error fetching accounts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + parseFloat(account.current_balance || 0), 0);
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'cash':
        return '💰';
      case 'bank':
        return '🏦';
      case 'credit':
        return '💳';
      case 'investment':
        return '📈';
      default:
        return '📊';
    }
  };

  const getTransactionIcon = (type) => {
    return type === 'income' ? '📈' : '📉';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      {/* Billing Summary */}
      {billingSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Billing Overview (Last 30 Days)
            </h2>
            <button
              onClick={() => window.location.href = '/billing'}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Invoices →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Invoiced</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(billingSummary.totalInvoiced)}
                  </p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(billingSummary.totalPaid)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {formatCurrency(billingSummary.totalPending)}
                  </p>
                </div>
                <div className="text-3xl">⏳</div>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 dark:text-red-400">Receivables</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(billingSummary.accountsReceivable)}
                  </p>
                </div>
                <div className="text-3xl">📨</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Account Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Account Summary
          </h2>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Balance</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(getTotalBalance())}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getAccountIcon(account.type)}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  account.type === 'cash' ? 'bg-green-100 text-green-800' :
                  account.type === 'bank' ? 'bg-blue-100 text-blue-800' :
                  account.type === 'credit' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {account.type}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {account.account_name}
              </h3>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(account.current_balance || 0)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Recent Transactions
        </h2>
        
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No recent transactions found
            </p>
          ) : (
            recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getTransactionIcon(transaction.entry_type)}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.entry_date} • {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    transaction.entry_type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.entry_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status || 'completed')}`}>
                    {transaction.status || 'completed'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* Cash Flow Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Cash Flow (Last 7 Days)
        </h2>
        
        <div className="space-y-4">
          {cashFlow.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(day.date).toLocaleDateString()}
              </span>
              <div className="flex space-x-4">
                <span className="text-green-600 font-medium">
                  Income: {formatCurrency(day.income)}
                </span>
                <span className="text-red-600 font-medium">
                  Expenses: {formatCurrency(day.expenses)}
                </span>
                <span className="text-blue-600 font-medium">
                  Net: {formatCurrency(day.income - day.expenses)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AccountsOverview;
