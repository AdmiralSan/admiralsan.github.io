import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';
import { reportsAPI } from '../../utils/accountsAPI';

const AccountsReports = () => {
  const { formatCurrency } = useCurrency();
  const [selectedReport, setSelectedReport] = useState('profit_loss');
  const [dateRange, setDateRange] = useState('this_month');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { value: 'profit_loss', label: 'Profit & Loss Statement', icon: '📊' },
    { value: 'cash_flow', label: 'Cash Flow Statement', icon: '💰' },
    { value: 'balance_sheet', label: 'Balance Sheet', icon: '⚖️' },
    { value: 'expense_analysis', label: 'Expense Analysis', icon: '📉' },
    { value: 'income_analysis', label: 'Income Analysis', icon: '📈' }
  ];

  const dateRangeOptions = [
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  useEffect(() => {
    generateReport();
  }, [selectedReport, dateRange]);

  const generateReport = async () => {
    setLoading(true);
    
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'this_month':
          startDate.setDate(1);
          break;
        case 'last_month':
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1);
          endDate.setMonth(endDate.getMonth() - 1);
          endDate.setDate(0);
          break;
        case 'this_quarter':
          const quarter = Math.floor(startDate.getMonth() / 3);
          startDate.setMonth(quarter * 3);
          startDate.setDate(1);
          break;
        case 'this_year':
          startDate.setMonth(0);
          startDate.setDate(1);
          break;
        // Add more date range cases as needed
      }
      
      let data = null;
      
      if (selectedReport === 'profit_loss') {
        data = await reportsAPI.getProfitLossData(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else if (selectedReport === 'cash_flow') {
        data = await reportsAPI.getCashFlowData(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else if (selectedReport === 'balance_sheet') {
        data = await reportsAPI.getBalanceSheetData();
      }
      
      setReportData(data);
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProfitLossReport = (data) => {
    const totalIncome = Object.values(data.income).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(data.expenses).reduce((sum, val) => sum + val, 0);
    const netIncome = totalIncome - totalExpenses;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Profit & Loss Statement
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For {data.period}
          </p>
        </div>

        {/* Income Section */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Income</h4>
          <div className="space-y-2">
            {Object.entries(data.income).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Total Income</span>
                <span className="text-green-600">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">Expenses</h4>
          <div className="space-y-2">
            {Object.entries(data.expenses).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className="font-medium text-red-600">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Total Expenses</span>
                <span className="text-red-600">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Income */}
        <div className={`rounded-lg p-4 ${netIncome >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Income</span>
            <span className={`text-xl font-bold ${netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowReport = (data) => {
    const operatingCashFlow = Object.values(data.operating_activities).reduce((sum, val) => sum + val, 0);
    const investingCashFlow = Object.values(data.investing_activities).reduce((sum, val) => sum + val, 0);
    const financingCashFlow = Object.values(data.financing_activities).reduce((sum, val) => sum + val, 0);
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cash Flow Statement
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            For {dateRange.replace('_', ' ')}
          </p>
        </div>

        {/* Operating Activities */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Operating Activities</h4>
          <div className="space-y-2">
            {Object.entries(data.operating_activities).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Net Operating Cash Flow</span>
                <span className={operatingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(operatingCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Investing Activities</h4>
          <div className="space-y-2">
            {Object.entries(data.investing_activities).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Net Investing Cash Flow</span>
                <span className={investingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(investingCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">Financing Activities</h4>
          <div className="space-y-2">
            {Object.entries(data.financing_activities).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Net Financing Cash Flow</span>
                <span className={financingCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(financingCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className={`rounded-lg p-4 ${netCashFlow >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Net Cash Flow</span>
            <span className={`text-xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCashFlow)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = (data) => {
    const totalCurrentAssets = Object.values(data.assets.current_assets).reduce((sum, val) => sum + val, 0);
    const totalFixedAssets = Object.values(data.assets.fixed_assets).reduce((sum, val) => sum + val, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = Object.values(data.liabilities.current_liabilities).reduce((sum, val) => sum + val, 0);
    const totalLongTermLiabilities = Object.values(data.liabilities.long_term_liabilities).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

    const totalEquity = Object.values(data.equity).reduce((sum, val) => sum + val, 0);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Balance Sheet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            As of {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Assets */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Assets</h4>
          
          <div className="mb-4">
            <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Current Assets</h5>
            <div className="space-y-2 pl-4">
              {Object.entries(data.assets.current_assets).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-white">Total Current Assets</span>
                  <span className="text-blue-600">{formatCurrency(totalCurrentAssets)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Fixed Assets</h5>
            <div className="space-y-2 pl-4">
              {Object.entries(data.assets.fixed_assets).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                    {key.replace('_', ' ')}
                  </span>
                  <span className={`font-medium ${value >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-white">Total Fixed Assets</span>
                  <span className="text-blue-600">{formatCurrency(totalFixedAssets)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-900 dark:text-white">Total Assets</span>
              <span className="text-blue-600">{formatCurrency(totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3">Liabilities</h4>
          
          <div className="mb-4">
            <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Current Liabilities</h5>
            <div className="space-y-2 pl-4">
              {Object.entries(data.liabilities.current_liabilities).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-white">Total Current Liabilities</span>
                  <span className="text-red-600">{formatCurrency(totalCurrentLiabilities)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="font-medium text-gray-800 dark:text-gray-300 mb-2">Long-term Liabilities</h5>
            <div className="space-y-2 pl-4">
              {Object.entries(data.liabilities.long_term_liabilities).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span className="text-gray-900 dark:text-white">Total Long-term Liabilities</span>
                  <span className="text-red-600">{formatCurrency(totalLongTermLiabilities)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-900 dark:text-white">Total Liabilities</span>
              <span className="text-red-600">{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>
        </div>

        {/* Equity */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">Equity</h4>
          <div className="space-y-2">
            {Object.entries(data.equity).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
                  {key.replace('_', ' ')}
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(value)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-900 dark:text-white">Total Equity</span>
                <span className="text-green-600">{formatCurrency(totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Liabilities + Equity
            </span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(totalLiabilities + totalEquity)}
            </span>
          </div>
          <div className="text-center mt-2">
            <span className={`text-sm font-medium ${
              totalAssets === (totalLiabilities + totalEquity) ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalAssets === (totalLiabilities + totalEquity) ? '✓ Balance Sheet Balanced' : '✗ Balance Sheet Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderReport = () => {
    if (!reportData) return null;

    switch (selectedReport) {
      case 'profit_loss':
        return renderProfitLossReport(reportData);
      case 'cash_flow':
        return renderCashFlowReport(reportData);
      case 'balance_sheet':
        return renderBalanceSheet(reportData);
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Report type not implemented yet.
            </p>
          </div>
        );
    }
  };

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
            Financial Reports
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate comprehensive financial reports and analytics
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Print Report
        </button>
      </motion.div>

      {/* Report Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {reportTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Report Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderReport()
        )}
      </motion.div>
    </div>
  );
};

export default AccountsReports;
