import React, { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { supabase } from '../supabaseClient';
import CustomerForm from '../components/CustomerForm';

// Add custom CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
  }
`;

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [detailsModal, setDetailsModal] = useState({ open: false, customer: null, invoices: [], totalSpending: 0, pending: 0 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCustomer(null);
  };

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      if (selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', selectedCustomer.id);
        if (error) throw error;
      } else {
        // Add new customer
        const { error } = await supabase
          .from('customers')
          .insert([formData]);
        if (error) throw error;
      }
      setShowForm(false);
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fuzzy filter
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q) ||
      (c.invoice_id && c.invoice_id.toString().includes(q))
    );
  });

  // Fetch invoices for customer and open modal
  const openDetails = async (customer) => {
    setLoading(true);
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id);
      if (error) throw error;
      
      // Calculate total spending (fully paid + partially paid amounts)
      const totalSpending = invoices?.reduce((sum, i) => {
        if (i.payment_status === 'paid') {
          return sum + parseFloat(i.total_amount || 0);
        } else if (i.payment_status === 'partial' && i.amount_paid) {
          return sum + parseFloat(i.amount_paid || 0);
        }
        return sum;
      }, 0) || 0;
      
      // Calculate pending amount (total amount - paid amount for partial payments)
      const pending = invoices?.reduce((sum, i) => {
        if (i.payment_status === 'pending') {
          return sum + parseFloat(i.total_amount || 0);
        } else if (i.payment_status === 'partial') {
          const totalAmount = parseFloat(i.total_amount || 0);
          const paidAmount = parseFloat(i.amount_paid || 0);
          return sum + (totalAmount - paidAmount);
        }
        return sum;
      }, 0) || 0;
      
      // Get payment history from payments table
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('customer_id', customer.id);
      
      if (paymentsError) throw paymentsError;
      
      setDetailsModal({ 
        open: true, 
        customer, 
        invoices, 
        totalSpending, 
        pending,
        payments: payments || []
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download invoice as JSON (replace with PDF/CSV as needed)
  const downloadInvoice = (invoice) => {
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    saveAs(blob, `invoice-${invoice.id}.json`);
  };

  // Batch download all invoices
  const downloadAllInvoices = () => {
    detailsModal.invoices.forEach(downloadInvoice);
  };

  return (
    <div className="p-6">
      <style>{styles}</style>
      {/* Header section with title and actions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-slate-800">Customer Management</h1>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-sm"
            onClick={handleAdd}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
          </button>
        </div>
        <p className="text-slate-600 max-w-2xl">
          Manage your customers, track their purchases, view payment history, and download invoices.
        </p>
      </div>

      {/* Search and filter section */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className="pl-10 w-full border border-slate-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name, phone, email, address, invoice id..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <select className="border border-slate-200 rounded-md px-3 py-2">
              <option value="">All Customers</option>
              <option value="recent">Recent Customers</option>
              <option value="high-value">High Value</option>
              <option value="pending">With Pending Payments</option>
            </select>
            <button className="border border-slate-200 bg-white rounded-md p-2">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 14a7 7 0 110-14 7 7 0 010 14z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-slate-900">No customers found</h3>
              <p className="mt-1 text-sm text-slate-500">Get started by adding a new customer.</p>
              <div className="mt-6">
                <button
                  onClick={handleAdd}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Customer
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => openDetails(customer)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium">
                            {customer.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                            <div className="text-sm text-slate-500">Customer #{customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{customer.phone}</div>
                        <div className="text-sm text-slate-500">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 line-clamp-2">{customer.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          onClick={e => { e.stopPropagation(); openDetails(customer); }}
                        >
                          View
                        </button>
                        <button 
                          className="text-indigo-600 hover:text-indigo-900" 
                          onClick={e => { e.stopPropagation(); handleEdit(customer); }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
                <div className="text-sm text-slate-700">
                  Showing <span className="font-medium">{filteredCustomers.length}</span> customers
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative animate-fade-in">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-800">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                onClick={handleFormClose}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <CustomerForm
                customer={selectedCustomer}
                onCancel={handleFormClose}
                onSubmit={handleFormSubmit}
              />
            </div>
          </div>
        </div>
      )}
      {detailsModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-semibold text-slate-800">Customer Profile</h2>
              <button 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setDetailsModal({ ...detailsModal, open: false })}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              {/* Customer Details Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-semibold">
                      {detailsModal.customer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-slate-800">{detailsModal.customer.name}</h3>
                      <p className="text-sm text-slate-500">Customer #{detailsModal.customer.id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-slate-600">Phone</div>
                      <div className="text-slate-800">{detailsModal.customer.phone}</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-slate-600">Email</div>
                      <div className="text-slate-800">{detailsModal.customer.email}</div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm font-medium text-slate-600">Address</div>
                      <div className="text-slate-800">{detailsModal.customer.address}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 flex flex-col justify-center">
                  <h4 className="text-sm font-medium text-slate-600 mb-4">Financial Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Total Spending</p>
                      <p className="text-2xl font-semibold text-slate-800">₹{detailsModal.totalSpending.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Pending</p>
                      <p className="text-2xl font-semibold text-red-600">₹{detailsModal.pending.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-2">Payment Status</p>
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${detailsModal.totalSpending ? (detailsModal.totalSpending / (detailsModal.totalSpending + detailsModal.pending) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-slate-500">
                        {detailsModal.totalSpending ? Math.round((detailsModal.totalSpending / (detailsModal.totalSpending + detailsModal.pending) * 100)) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment History */}
              {detailsModal.payments && detailsModal.payments.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-800">Payment History</h3>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Method</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {detailsModal.payments.map(payment => (
                            <tr key={payment.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{payment.payment_date}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{payment.reference_number}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{payment.payment_method}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">₹{parseFloat(payment.amount).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {payment.notes && payment.notes.includes('Partial payment') ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                    Partial
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Full
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Billing History */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-slate-800">Invoice History</h3>
                  <button 
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors shadow-sm"
                    onClick={downloadAllInvoices}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download All
                  </button>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Invoice #</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {detailsModal.invoices.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-4 text-center text-sm text-slate-500">No invoices found for this customer</td>
                          </tr>
                        ) : (
                          detailsModal.invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{inv.invoice_number}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{inv.invoice_date}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">₹{parseFloat(inv.total_amount).toFixed(2)}</td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  inv.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                                  inv.payment_status === 'partial' ? 'bg-blue-100 text-blue-800' :
                                  inv.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {inv.payment_status}
                                </span>
                                {inv.payment_status === 'partial' && inv.amount_paid && (
                                  <div className="text-xs text-slate-500 mt-1">
                                    Paid: ₹{parseFloat(inv.amount_paid).toFixed(2)} of ₹{parseFloat(inv.total_amount).toFixed(2)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <button 
                                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                                  onClick={() => downloadInvoice(inv)}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                  </svg>
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
