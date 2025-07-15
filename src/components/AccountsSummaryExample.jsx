// Example component for using the billing accounts integration in other pages
import React, { useState, useEffect } from 'react';
import { getAccountSummary, getPendingAmountsBreakdown } from '../utils/billingAccountsIntegration';

const AccountsSummaryExample = () => {
  const [summary, setSummary] = useState(null);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    try {
      setLoading(true);
      
      // Get overall account summary
      const accountSummary = await getAccountSummary({ 
        timePeriod: 'all', 
        includeDetails: true 
      });
      
      // Get detailed breakdown of pending amounts
      const pendingData = await getPendingAmountsBreakdown();
      
      setSummary(accountSummary);
      setPendingBreakdown(pendingData);
    } catch (error) {
      console.error('Error fetching accounts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return <div className="p-4">Loading accounts data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Accounts Overview</h2>
      
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Invoiced</h3>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(summary.totalInvoiced)}
            </p>
          </div>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Total Paid</h3>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(summary.totalPaid)}
            </p>
          </div>
          
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Total Pending</h3>
            <p className="text-2xl font-bold text-yellow-900">
              {formatCurrency(summary.totalPending)}
            </p>
            <p className="text-sm text-yellow-700">
              Includes {summary.breakdown?.partialInvoices || 0} partial payments
            </p>
          </div>
        </div>
      )}

      {/* Pending Amounts Breakdown */}
      {pendingBreakdown && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Amounts Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fully Pending Invoices */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">
                Fully Pending Invoices ({pendingBreakdown.pendingInvoices.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingBreakdown.pendingInvoices.map(invoice => (
                  <div key={invoice.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                    </div>
                    <p className="font-medium text-red-600">
                      {formatCurrency(invoice.pending_amount)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold">
                  Total: {formatCurrency(pendingBreakdown.totals.pendingTotal)}
                </p>
              </div>
            </div>

            {/* Partially Paid Invoices */}
            <div>
              <h4 className="font-medium text-gray-700 mb-3">
                Partially Paid Invoices ({pendingBreakdown.partialInvoices.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingBreakdown.partialInvoices.map(invoice => (
                  <div key={invoice.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-orange-600">
                          {formatCurrency(invoice.pending_amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Paid: {formatCurrency(invoice.amount_paid)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t">
                <p className="font-semibold">
                  Total: {formatCurrency(pendingBreakdown.totals.partialTotal)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Pending Summary */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Pending Amount:</span>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(pendingBreakdown.totals.totalPending)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchAccountsData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AccountsSummaryExample;
