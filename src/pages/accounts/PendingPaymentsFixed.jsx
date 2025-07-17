import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPendingAmountsBreakdown } from '../../utils/billingAccountsIntegration';
import { supabase } from '../../supabaseClient';
import PendingInvoiceDetail from '../../components/PendingInvoiceDetail';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PendingPayments = () => {
  const navigate = useNavigate();
  const [pendingData, setPendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInvoiceListModal, setShowInvoiceListModal] = useState(false);
  const [invoiceListType, setInvoiceListType] = useState('all'); // 'all', 'pending', or 'partial'
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortByAmount, setSortByAmount] = useState('desc');
  
  // Month-wise filtering and date range states
  const [filterType, setFilterType] = useState('all'); // 'all', 'month', 'range'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState([null, null]); // [startDate, endDate]
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const data = await getPendingAmountsBreakdown();
      setPendingData(data);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = async (invoice) => {
    try {
      // Fetch detailed invoice data with customer information
      const { data: detailedInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, variant_id, quantity, unit_price, discount_percent, 
            serial_number, warranty_months,
            products (name, sku),
            product_variants (attribute_name, value)
          )
        `)
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      setSelectedInvoice(detailedInvoice);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      alert('Error loading invoice details');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Helper function to convert a date to YYYY-MM-DD format
  const formatDateForCSV = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };
  
  // Function to download the current filtered invoices as CSV with detailed information
  const downloadCSV = async () => {
    if (!sortedInvoices || sortedInvoices.length === 0) {
      alert('No data to download');
      return;
    }
    
    try {
      // Show loading or processing indicator
      setLoading(true);
      
      // For each invoice, fetch detailed information including payment history and products
      const detailedInvoices = await Promise.all(
        sortedInvoices.map(async (invoice) => {
          // Fetch detailed invoice data with customer information and items
          const { data: detailedInvoice, error: invoiceError } = await supabase
            .from('invoices')
            .select(`
              *,
              customers (
                id, name, phone, email, address
              ),
              invoice_items (
                id, product_id, variant_id, quantity, unit_price, discount_percent, 
                serial_number, warranty_months,
                products (name, sku, description),
                product_variants (attribute_name, value)
              )
            `)
            .eq('id', invoice.id)
            .single();
            
          if (invoiceError) {
            console.error('Error fetching invoice details:', invoiceError);
            return invoice; // Return basic invoice if detailed fetch fails
          }
          
          // Fetch payment history for the invoice
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', invoice.id)
            .order('payment_date', { ascending: false });
            
          if (paymentsError) {
            console.error('Error fetching payment history:', paymentsError);
          }
          
          return {
            ...detailedInvoice,
            payments: payments || []
          };
        })
      );
      
      // Generate CSV header
      const headers = [
        'Invoice Number', 'Customer Name', 'Customer Phone', 'Customer Email', 'Invoice Date', 
        'Total Amount', 'Amount Paid', 'Pending Amount', 'Status', 
        'Product Details', 'Payment History'
      ];
      
      // Generate CSV rows
      const csvRows = [
        headers.join(','),
        ...detailedInvoices.map(invoice => {
          // Format product details
          const productDetails = invoice.invoice_items?.map(item => {
            return `${item.products?.name || 'Unknown Product'} (${item.quantity}x${item.unit_price}${item.discount_percent > 0 ? ` -${item.discount_percent}%` : ''})${item.serial_number ? ` S/N:${item.serial_number}` : ''}`;
          }).join('; ') || 'No products';
          
          // Format payment history
          const paymentHistory = invoice.payments?.map(payment => {
            return `${formatDateForCSV(payment.payment_date)}: ${payment.amount} via ${payment.payment_method || 'Unknown'}`;
          }).join('; ') || 'No payment records';
          
          return [
            invoice.invoice_number,
            `"${(invoice.customers?.name || invoice.customer_name || 'Unknown').replace(/"/g, '""')}"`, // Escape quotes in customer names
            `"${(invoice.customers?.phone || '').replace(/"/g, '""')}"`,
            `"${(invoice.customers?.email || '').replace(/"/g, '""')}"`,
            formatDateForCSV(invoice.invoice_date),
            invoice.total_amount,
            invoice.amount_paid || 0,
            (invoice.total_amount - (invoice.amount_paid || 0)),
            invoice.payment_status,
            `"${productDetails.replace(/"/g, '""')}"`,
            `"${paymentHistory.replace(/"/g, '""')}"`
          ].join(',');
        })
      ];
      
      // Create a CSV blob and download it
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create download link and click it
      const link = document.createElement('a');
      const fileName = getCSVFileName();
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating detailed CSV:', error);
      alert('Error generating detailed report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate appropriate filename based on current filters
  const getCSVFileName = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    let filterDescription = '';
    
    if (filterType === 'month') {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                         'July', 'August', 'September', 'October', 'November', 'December'];
      filterDescription = `${monthNames[selectedMonth]}-${selectedYear}`;
    } else if (filterType === 'range' && startDate && endDate) {
      filterDescription = `${formatDateForCSV(startDate)}_to_${formatDateForCSV(endDate)}`;
    } else {
      filterDescription = 'all';
    }
    
    const typeDescription = invoiceListType === 'pending' ? 'Pending' : 
                           invoiceListType === 'partial' ? 'Partial' : 'All';
                           
    return `Pending_Payments_${typeDescription}_${filterDescription}_${dateStr}.csv`;
  };

  const getSortedInvoices = () => {
    if (!pendingData) return [];
    
    let invoices;
    
    // Filter by invoice type
    if (invoiceListType === 'pending') {
      invoices = [...pendingData.pendingInvoices];
    } else if (invoiceListType === 'partial') {
      invoices = [...pendingData.partialInvoices];
    } else {
      // 'all' - show both types
      invoices = [
        ...pendingData.pendingInvoices,
        ...pendingData.partialInvoices
      ];
    }

    // Apply date filtering based on filter type
    if (filterType === 'month' && selectedMonth !== null && selectedYear !== null) {
      invoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate.getMonth() === selectedMonth && 
               invoiceDate.getFullYear() === selectedYear;
      });
    } else if (filterType === 'range' && startDate && endDate) {
      invoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });
    }

    return invoices.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.invoice_date);
        const dateB = new Date(b.invoice_date);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'amount') {
        const amountA = a.pending_amount;
        const amountB = b.pending_amount;
        return sortByAmount === 'asc' ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
  };

  const handleDateSort = (order) => {
    setSortBy('date');
    setSortOrder(order);
  };

  const handleAmountSort = (order) => {
    setSortBy('amount');
    setSortByAmount(order);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedInvoices = getSortedInvoices();

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pending Payments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all pending invoices and partial payments
            </p>
          </div>
          <button
            onClick={fetchPendingPayments}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Info Text */}
      <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p>Click on any card below to see a list of those invoices. Click on any invoice to view its detailed information.</p>
      </div>
      
      {/* Summary Cards */}
      {pendingData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setInvoiceListType('pending');
              setShowInvoiceListModal(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Fully Pending</p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">
                  {formatCurrency(pendingData.totals.pendingTotal)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {pendingData.pendingInvoices.length} invoices
                </p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setInvoiceListType('partial');
              setShowInvoiceListModal(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Partial Remaining</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {formatCurrency(pendingData.totals.partialTotal)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {pendingData.partialInvoices.length} invoices
                </p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 border border-red-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setInvoiceListType('all');
              setShowInvoiceListModal(true);
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Pending</p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(pendingData.totals.totalPending)}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {sortedInvoices.length} invoices
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Payments Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Recent Activity</span>
              <span className="text-lg font-semibold mt-1">
                {sortedInvoices.length > 0 ? (
                  `${sortedInvoices.length} invoices need attention`
                ) : (
                  "No pending invoices"
                )}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Total Pending Amount</span>
              <span className="text-lg font-semibold text-red-600 mt-1">
                {pendingData ? formatCurrency(pendingData.totals.totalPending) : "Loading..."}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Most Recent</span>
              <span className="text-lg font-semibold mt-1">
                {sortedInvoices.length > 0 ? (
                  new Date(sortedInvoices[0].invoice_date).toLocaleDateString()
                ) : (
                  "No recent invoices"
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Month and Date Range Filtering */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Invoices</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">View:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Invoices</option>
                <option value="month">By Month</option>
                <option value="range">By Date Range</option>
              </select>
            </div>
            
            {filterType === 'month' && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Month:</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Year:</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </>
            )}
            
            {filterType === 'range' && (
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Select Range:</label>
                <div className="flex-grow">
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={(update) => {
                      setDateRange(update);
                    }}
                    isClearable={true}
                    dateFormat="dd/MM/yyyy"
                    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select date range"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
              </div>
            )}
            
            <div className="ml-auto">
              <button 
                onClick={downloadCSV}
                disabled={!sortedInvoices || sortedInvoices.length === 0}
                className={`
                  inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                  ${sortedInvoices && sortedInvoices.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                `}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {loading ? 'Preparing...' : 'Download Detailed List'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                sortBy === 'date' && 'bg-white shadow-sm'
              }`}
              onClick={() => {
                setSortBy('date');
                setSortOrder('desc');
              }}
            >
              Sort by Date
            </button>
            <button
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                sortBy === 'amount' && 'bg-white shadow-sm'
              }`}
              onClick={() => {
                setSortBy('amount');
                setSortByAmount('desc');
              }}
            >
              Sort by Amount
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              setInvoiceListType('all');
              setShowInvoiceListModal(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View All Invoices
          </button>
          <button
            className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            onClick={() => {
              setInvoiceListType('pending');
              setShowInvoiceListModal(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View Pending Invoices
          </button>
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              setInvoiceListType('partial');
              setShowInvoiceListModal(true);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            View Partial Invoices
          </button>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedInvoice && (
          <PendingInvoiceDetail
            invoice={selectedInvoice}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedInvoice(null);
            }}
            onPaymentComplete={() => {
              fetchPendingPayments();
              setShowDetailModal(false);
              setSelectedInvoice(null);
            }}
            onEditInvoice={(invoice) => {
              // Navigate to billing page with the invoice ID to edit
              navigate('/billing', { state: { editInvoiceId: invoice.id } });
            }}
          />
        )}
      </AnimatePresence>

      {/* Invoice List Modal */}
      <AnimatePresence>
        {showInvoiceListModal && (
          <Modal handleClose={() => setShowInvoiceListModal(false)} size="large">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {invoiceListType === 'pending' 
                      ? 'Fully Pending Invoices'
                      : invoiceListType === 'partial'
                        ? 'Partially Paid Invoices'
                        : 'All Pending Invoices'
                    }
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {invoiceListType === 'pending' 
                      ? `${pendingData.pendingInvoices.length} invoices pending payment`
                      : invoiceListType === 'partial'
                        ? `${pendingData.partialInvoices.length} invoices with partial payments`
                        : `${sortedInvoices.length} total pending invoices`
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoiceListModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sorting Controls */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <h3 className="text-sm font-medium text-gray-700">Sort By:</h3>
                    
                    <div className="flex flex-wrap gap-4">
                      {/* Date Sorting */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Date:</label>
                        <select
                          value={sortBy === 'date' ? sortOrder : ''}
                          onChange={(e) => handleDateSort(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="desc">Newest First</option>
                          <option value="asc">Oldest First</option>
                        </select>
                      </div>

                      {/* Amount Sorting */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-700">Amount:</label>
                        <select
                          value={sortBy === 'amount' ? sortByAmount : ''}
                          onChange={(e) => handleAmountSort(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select</option>
                          <option value="desc">Highest First</option>
                          <option value="asc">Lowest First</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Filter Options */}
                  <div className="border-t pt-4 mt-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Filter By Date:</h3>
                    
                    <div className="flex flex-wrap gap-4 items-center">
                      {/* Filter Type Selection */}
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="filter-type"
                            value="all"
                            checked={filterType === 'all'}
                            onChange={() => setFilterType('all')}
                          />
                          <span className="ml-2 text-sm text-gray-700">All</span>
                        </label>
                        
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="filter-type"
                            value="month"
                            checked={filterType === 'month'}
                            onChange={() => setFilterType('month')}
                          />
                          <span className="ml-2 text-sm text-gray-700">Month</span>
                        </label>
                        
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            className="form-radio text-blue-600"
                            name="filter-type"
                            value="range"
                            checked={filterType === 'range'}
                            onChange={() => setFilterType('range')}
                          />
                          <span className="ml-2 text-sm text-gray-700">Date Range</span>
                        </label>
                      </div>
                      
                      {/* Month Filter Controls */}
                      {filterType === 'month' && (
                        <div className="flex gap-2 items-center">
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Month:</label>
                            <select
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="0">January</option>
                              <option value="1">February</option>
                              <option value="2">March</option>
                              <option value="3">April</option>
                              <option value="4">May</option>
                              <option value="5">June</option>
                              <option value="6">July</option>
                              <option value="7">August</option>
                              <option value="8">September</option>
                              <option value="9">October</option>
                              <option value="10">November</option>
                              <option value="11">December</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Year:</label>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {Array.from({ length: 5 }, (_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Date Range Filter */}
                      {filterType === 'range' && (
                        <div className="flex flex-wrap gap-3 items-center">
                          <label className="text-sm text-gray-700">Select Range:</label>
                          <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => {
                              setDateRange(update);
                            }}
                            isClearable={true}
                            dateFormat="dd/MM/yyyy"
                            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholderText="Select date range"
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={downloadCSV}
                      disabled={!sortedInvoices || sortedInvoices.length === 0}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                        ${sortedInvoices && sortedInvoices.length > 0
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
                      `}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {loading ? 'Preparing...' : `Download ${filterType !== 'all' ? 'Filtered' : ''} Detailed List`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Status */}
              {filterType !== 'all' && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex justify-between items-center">
                  <div>
                    {filterType === 'month' ? (
                      <p>
                        Showing invoices for {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} {selectedYear}
                      </p>
                    ) : (
                      <p>
                        {startDate && endDate ? (
                          `Showing invoices from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`
                        ) : (
                          'Please select a complete date range'
                        )}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => setFilterType('all')}
                    className="text-blue-700 hover:text-blue-900 text-sm font-medium"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
              
              {/* Invoice List */}
              {sortedInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">🎉</div>
                  <p className="text-gray-500 text-lg">
                    {invoiceListType === 'pending' 
                      ? 'No fully pending invoices found!'
                      : invoiceListType === 'partial'
                        ? 'No partially paid invoices found!'
                        : 'No pending payments!'
                    }
                    {filterType !== 'all' && (
                      <span className="block mt-2 text-sm">
                        Try changing your filter settings or view all invoices
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary of filtered data */}
                  <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Total Invoices:</span>
                        <p className="font-medium">{sortedInvoices.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Total Pending Amount:</span>
                        <p className="font-medium text-red-600">
                          {formatCurrency(sortedInvoices.reduce((sum, inv) => sum + inv.pending_amount, 0))}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Date Range:</span>
                        <p className="font-medium">
                          {filterType === 'month' 
                            ? `${new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' })} ${selectedYear}`
                            : filterType === 'range' && startDate && endDate
                              ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
                              : 'All Dates'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedInvoices.map((invoice) => (
                        <motion.tr
                          key={invoice.id}
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          className="cursor-pointer"
                          onClick={() => {
                            handleInvoiceClick(invoice);
                            setShowInvoiceListModal(false);
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {invoice.invoice_number}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(invoice.total_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(invoice.amount_paid || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-red-600">
                              {formatCurrency(invoice.pending_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`
                              px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${invoice.amount_paid ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}
                            `}>
                              {invoice.amount_paid ? 'Partial' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInvoiceClick(invoice);
                                  setShowInvoiceListModal(false);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowInvoiceListModal(false);
                                  // Navigate directly to billing page with invoice ID for editing
                                  navigate('/billing', { state: { editInvoiceId: invoice.id } });
                                }}
                                className="text-amber-600 hover:text-amber-900"
                                title="Edit Invoice"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PendingPayments;
