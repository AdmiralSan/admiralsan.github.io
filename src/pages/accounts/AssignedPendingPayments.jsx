import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { getPendingAmountsBreakdown } from '../../utils/billingAccountsIntegration';
import PendingInvoiceDetail from '../../components/PendingInvoiceDetail';
import Modal from '../../components/Modal';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId } from '../../utils/clerkUserUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const AssignedPendingPayments = () => {
  const navigate = useNavigate();
  const [pendingData, setPendingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, not_started, in_progress, collected, failed
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchCurrentUserAndStatus();
    fetchAssignedInvoices();
    fetchAvailableUsers();
  }, []);

  const fetchCurrentUserAndStatus = async () => {
    try {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      
      // Check if the user is an admin
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const fetchAssignedInvoices = async () => {
    try {
      setLoading(true);
      
      // First check if the assigned_user_id column exists
      const { error: tableCheckError } = await supabase
        .from('invoices')
        .select('assigned_user_id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Error: Invoice assignment feature is not set up yet. Run schema-invoice-assignments.sql first.');
        setPendingData({ assignedInvoices: [], totalAssigned: 0 });
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          users!invoices_assigned_user_id_fkey (
            id, full_name, email
          )
        `)
        .in('payment_status', ['pending', 'partial']);
        
      // If not admin, only show invoices assigned to the current user
      if (!isAdmin && currentUserId) {
        query = query.eq('assigned_user_id', currentUserId);
      } else {
        // For admins, we can filter on any user by using IS NOT NULL
        query = query.not('assigned_user_id', 'is', null);
      }

      // Apply status filter if needed
      if (filterStatus !== 'all') {
        query = query.eq('collection_status', filterStatus);
      }
        
      // Apply sorting
      query = query.order('invoice_date', { ascending: sortOrder === 'asc' });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate total amount from assigned invoices
      const totalAssigned = (data || []).reduce((sum, invoice) => {
        // Calculate pending amount for each invoice
        const pendingAmount = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0);
        return sum + pendingAmount;
      }, 0);
      
      setPendingData({ 
        assignedInvoices: data || [],
        totalAssigned
      });
    } catch (error) {
      console.error('Error fetching assigned invoices:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .order('full_name', { ascending: true });
        
      if (error) throw error;
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  };

  const handleAssignmentClick = (invoice) => {
    setSelectedInvoice(invoice);
    setSelectedUser(invoice.assigned_user_id || null);
    setAssignmentNotes('');
    setShowAssignModal(true);
  };

  const handleAssignmentSubmit = async () => {
    try {
      if (!selectedInvoice || !selectedUser) {
        alert('Please select a user to assign the invoice to');
        return;
      }
      
      const { data, error } = await supabase.rpc('assign_invoice', {
        p_invoice_id: selectedInvoice.id,
        p_user_id: selectedUser,
        p_notes: assignmentNotes || null
      });
      
      if (error) throw error;
      
      // Refresh the invoice list
      fetchAssignedInvoices();
      setShowAssignModal(false);
      setSelectedInvoice(null);
      setSelectedUser(null);
      setAssignmentNotes('');
    } catch (error) {
      console.error('Error assigning invoice:', error);
      alert('Error assigning invoice. Please try again.');
    }
  };

  const handleUnassignInvoice = async (invoiceId) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          assigned_user_id: null,
          assignment_date: null,
          assignment_notes: null,
          collection_status: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
        
      if (error) throw error;
      
      // Refresh the invoice list
      fetchAssignedInvoices();
    } catch (error) {
      console.error('Error unassigning invoice:', error);
      alert('Error unassigning invoice. Please try again.');
    }
  };

  const handleStatusUpdate = async (invoiceId, status, notes = null) => {
    try {
      const { data, error } = await supabase.rpc('update_collection_status', {
        p_invoice_id: invoiceId,
        p_status: status,
        p_notes: notes
      });
      
      if (error) throw error;
      
      // Refresh the invoice list
      fetchAssignedInvoices();
    } catch (error) {
      console.error('Error updating collection status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'collected': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status) => {
    switch(status) {
      case 'not_started': return 'Not Started';
      case 'in_progress': return 'In Progress';
      case 'collected': return 'Collected';
      case 'failed': return 'Failed';
      default: return 'Not Assigned';
    }
  };

  const sortedInvoices = pendingData?.assignedInvoices?.sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.invoice_date);
      const dateB = new Date(b.invoice_date);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'amount') {
      const amountA = parseFloat(a.total_amount) - parseFloat(a.amount_paid || 0);
      const amountB = parseFloat(b.total_amount) - parseFloat(b.amount_paid || 0);
      return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
    }
    return 0;
  }) || [];

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Assigned Pending Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track invoices assigned for collection
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => navigate('/accounts/pending')}
              className="mt-3 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign New Invoices
            </button>
          )}
        </div>

        {/* Filter Options */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="collected">Collected</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSort('date')}
                  className={`px-3 py-2 rounded-lg border ${sortBy === 'date' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                >
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('amount')}
                  className={`px-3 py-2 rounded-lg border ${sortBy === 'amount' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => fetchAssignedInvoices()}
              className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h2 className="text-lg font-semibold text-blue-800">Assigned Invoices</h2>
            <div className="flex justify-between items-center mt-2">
              <span className="text-2xl font-bold text-blue-600">{pendingData?.assignedInvoices?.length || 0}</span>
              <span className="text-blue-500">Total</span>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <h2 className="text-lg font-semibold text-green-800">Amount to Collect</h2>
            <div className="flex justify-between items-center mt-2">
              <span className="text-2xl font-bold text-green-600">{formatCurrency(pendingData?.totalAssigned || 0)}</span>
              <span className="text-green-500">Total</span>
            </div>
          </div>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            <p className="mt-2 text-gray-500">Loading assigned invoices...</p>
          </div>
        ) : sortedInvoices.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No assigned invoices found</p>
            {isAdmin && (
              <button 
                onClick={() => navigate('/accounts/pending')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Assign Invoices
              </button>
            )}
          </div>
        ) : (
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
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
                {sortedInvoices.map((invoice) => {
                  const pendingAmount = parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid || 0);
                  
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{invoice.invoice_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.customers?.name}</div>
                        <div className="text-sm text-gray-500">{invoice.customers?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(pendingAmount)}</div>
                        <div className="text-xs text-gray-500">
                          {invoice.payment_status === 'partial' ? 'Partial Payment' : 'Pending'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.users?.full_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(invoice.assignment_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.collection_status)}`}>
                          {getStatusText(invoice.collection_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleInvoiceClick(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            View
                          </button>
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleAssignmentClick(invoice)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Reassign invoice"
                            >
                              Reassign
                            </button>
                          )}

                          {/* Status update buttons based on current status */}
                          {invoice.collection_status === 'not_started' && (
                            <button
                              onClick={() => handleStatusUpdate(invoice.id, 'in_progress')}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Mark as in progress"
                            >
                              Start
                            </button>
                          )}

                          {invoice.collection_status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(invoice.id, 'collected', 'Payment collected successfully')}
                                className="text-green-600 hover:text-green-900"
                                title="Mark as collected"
                              >
                                Collected
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(invoice.id, 'failed', 'Unable to collect payment')}
                                className="text-red-600 hover:text-red-900"
                                title="Mark as failed"
                              >
                                Failed
                              </button>
                            </>
                          )}

                          {isAdmin && ['collected', 'failed'].includes(invoice.collection_status) && (
                            <button
                              onClick={() => handleUnassignInvoice(invoice.id)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Unassign invoice"
                            >
                              Unassign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <PendingInvoiceDetail 
          invoice={selectedInvoice}
          onClose={handleCloseModal}
          onPaymentComplete={() => fetchAssignedInvoices()}
        />
      )}
      
      {/* Assignment Modal */}
      {showAssignModal && selectedInvoice && (
        <Modal handleClose={() => setShowAssignModal(false)} size="medium">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Assign Invoice #{selectedInvoice.invoice_number}
            </h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To User
              </label>
              <select
                value={selectedUser || ''}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user...</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add notes for the assignee..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignmentSubmit}
                disabled={!selectedUser}
                className={`px-4 py-2 rounded-lg ${selectedUser ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                Assign Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssignedPendingPayments;
