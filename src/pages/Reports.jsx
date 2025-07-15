import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ReportCard = ({ title, description, icon, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="card bg-white hover:shadow-lg transition-shadow cursor-pointer"
  >
    <div className="flex items-start gap-4">
      <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  </motion.div>
);

const FilterSection = ({ title, children }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-700">{title}</h3>
    {children}
  </div>
);

const Reports = () => {
  const [dateRange, setDateRange] = useState('last30');
  const [reportType, setReportType] = useState('inventory');

  const reports = [
    {
      title: 'Inventory Status',
      description: 'Current stock levels and value',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      onClick: () => console.log('Generate inventory report')
    },
    {
      title: 'Sales Analysis',
      description: 'Revenue and sales trends',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => console.log('Generate sales report')
    },
    {
      title: 'Low Stock Report',
      description: 'Items that need restocking',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
      onClick: () => console.log('Generate low stock report')
    },
    {
      title: 'Category Analysis',
      description: 'Performance by product category',
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
      onClick: () => console.log('Generate category report')
    }
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <button className="btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export All
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card bg-white space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
            
            <FilterSection title="Date Range">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full rounded-lg border-slate-200"
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </FilterSection>

            <FilterSection title="Report Type">
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-lg border-slate-200"
              >
                <option value="inventory">Inventory</option>
                <option value="sales">Sales</option>
                <option value="lowstock">Low Stock</option>
                <option value="category">Category</option>
              </select>
            </FilterSection>

            <FilterSection title="Categories">
              <div className="space-y-2">
                {['Electronics', 'Clothing', 'Food', 'Books'].map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-600">{category}</span>
                  </label>
                ))}
              </div>
            </FilterSection>

            <button className="btn-primary w-full">
              Apply Filters
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map((report) => (
              <ReportCard key={report.title} {...report} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card bg-white mt-6"
          >
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Reports</h2>
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Inventory Report</p>
                      <p className="text-xs text-slate-500">Generated 2 hours ago</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 