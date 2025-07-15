import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import Modal from './Modal';

const ExpiryTracker = () => {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, sku, invoice, customer
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, expired, expiring
  const [sortBy, setSortBy] = useState('warranty_end_date');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWarranty, setDeletingWarranty] = useState(null);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('warranty')
        .select(`
          *,
          products (
            id, name, sku, category
          ),
          invoices (
            id, invoice_number, invoice_date,
            customers (
              id, name, phone, email
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate warranty end dates and status
      const processedWarranties = (data || []).map(warranty => {
        const invoiceDate = new Date(warranty.invoices?.invoice_date || warranty.created_at);
        const warrantyEndDate = new Date(invoiceDate);
        warrantyEndDate.setMonth(warrantyEndDate.getMonth() + (warranty.warranty_months || 0));
        
        const today = new Date();
        const daysLeft = Math.ceil((warrantyEndDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'active';
        if (daysLeft < 0) status = 'expired';
        else if (daysLeft <= 30) status = 'expiring';
        
        return {
          ...warranty,
          warranty_end_date: warrantyEndDate,
          days_left: daysLeft,
          status
        };
      });
      
      setWarranties(processedWarranties);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWarrantyStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getWarrantyStatusText = (warranty) => {
    if (warranty.status === 'expired') {
      return `Expired ${Math.abs(warranty.days_left)} days ago`;
    } else if (warranty.status === 'expiring') {
      return `Expires in ${warranty.days_left} days`;
    } else {
      return `${warranty.days_left} days remaining`;
    }
  };

  const startEdit = (warranty) => {
    setEditingWarranty({
      ...warranty,
      warranty_months: warranty.warranty_months || 0
    });
    setShowEditModal(true);
  };

  const handleEdit = async (formData) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('warranty')
        .update({
          warranty_months: formData.warranty_months,
          serial_number: formData.serial_number || null
        })
        .eq('id', editingWarranty.id);
      
      if (error) throw error;
      
      setShowEditModal(false);
      setEditingWarranty(null);
      await fetchWarranties();
      
      alert('Warranty updated successfully');
    } catch (error) {
      console.error('Error updating warranty:', error);
      alert(`Error updating warranty: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (warranty) => {
    setDeletingWarranty(warranty);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('warranty')
        .delete()
        .eq('id', deletingWarranty.id);
      
      if (error) throw error;
      
      setShowDeleteConfirm(false);
      setDeletingWarranty(null);
      await fetchWarranties();
      
      alert('Warranty deleted successfully');
    } catch (error) {
      console.error('Error deleting warranty:', error);
      alert(`Error deleting warranty: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort warranties
  const filteredWarranties = warranties
    .filter(warranty => {
      // Status filter
      if (statusFilter !== 'all' && warranty.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const productName = warranty.products?.name?.toLowerCase() || '';
        const productSku = warranty.products?.sku?.toLowerCase() || '';
        const invoiceNumber = warranty.invoices?.invoice_number?.toLowerCase() || '';
        const customerName = warranty.invoices?.customers?.name?.toLowerCase() || '';
        const customerPhone = warranty.invoices?.customers?.phone?.toLowerCase() || '';
        const serialNumber = warranty.serial_number?.toLowerCase() || '';
        
        switch (searchType) {
          case 'sku':
            return productSku.includes(searchLower);
          case 'invoice':
            return invoiceNumber.includes(searchLower);
          case 'customer':
            return customerName.includes(searchLower) || customerPhone.includes(searchLower);
          case 'serial':
            return serialNumber.includes(searchLower);
          default: // 'all'
            return productName.includes(searchLower) || 
                   productSku.includes(searchLower) || 
                   invoiceNumber.includes(searchLower) ||
                   customerName.includes(searchLower) ||
                   customerPhone.includes(searchLower) ||
                   serialNumber.includes(searchLower);
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'product_name') {
        const aName = a.products?.name || '';
        const bName = b.products?.name || '';
        return sortDirection === 'asc' 
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      
      if (sortBy === 'customer_name') {
        const aName = a.invoices?.customers?.name || '';
        const bName = b.invoices?.customers?.name || '';
        return sortDirection === 'asc' 
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }
      
      if (sortBy === 'invoice_number') {
        const aInvoice = a.invoices?.invoice_number || '';
        const bInvoice = b.invoices?.invoice_number || '';
        return sortDirection === 'asc' 
          ? aInvoice.localeCompare(bInvoice)
          : bInvoice.localeCompare(aInvoice);
      }
      
      if (sortBy === 'warranty_months') {
        return sortDirection === 'asc' 
          ? (a.warranty_months || 0) - (b.warranty_months || 0)
          : (b.warranty_months || 0) - (a.warranty_months || 0);
      }
      
      // Default sort by warranty end date
      const aDate = new Date(a.warranty_end_date || 0);
      const bDate = new Date(b.warranty_end_date || 0);
      return sortDirection === 'asc' 
        ? aDate - bDate
        : bDate - aDate;
    });

  // Calculate summary statistics
  const totalWarranties = warranties.length;
  const activeWarranties = warranties.filter(w => w.status === 'active').length;
  const expiringWarranties = warranties.filter(w => w.status === 'expiring').length;
  const expiredWarranties = warranties.filter(w => w.status === 'expired').length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Warranty Tracking</h1>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Warranties</p>
              <p className="text-2xl font-semibold text-slate-900">{totalWarranties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Active</p>
              <p className="text-2xl font-semibold text-green-600">{activeWarranties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Expiring Soon</p>
              <p className="text-2xl font-semibold text-yellow-600">{expiringWarranties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-slate-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Expired</p>
              <p className="text-2xl font-semibold text-red-600">{expiredWarranties}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Warranty History</h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center">
              <label className="mr-2 text-sm text-slate-600">Search by:</label>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="all">All Fields</option>
                <option value="sku">SKU</option>
                <option value="invoice">Invoice ID</option>
                <option value="customer">Customer</option>
                <option value="serial">Serial Number</option>
              </select>
            </div>
            
            <div className="flex items-center">
              <label className="mr-2 text-sm text-slate-600">Status:</label>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            
            <input
              type="text"
              placeholder={`Search ${searchType === 'all' ? 'warranties' : searchType}...`}
              className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white w-full sm:w-auto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            />
          </div>
        ) : error ? (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-md p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-red-600">Error: {error}</p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {filteredWarranties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-700">No warranties found</h3>
                <p className="text-slate-500 mt-1">
                  {searchTerm ? 'No warranties match your search criteria' : 'No warranty records available'}
                </p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('product_name')}
                      >
                        Product {sortBy === 'product_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('invoice_number')}
                      >
                        Invoice {sortBy === 'invoice_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('customer_name')}
                      >
                        Customer {sortBy === 'customer_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('warranty_months')}
                      >
                        Period {sortBy === 'warranty_months' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none"
                        onClick={() => handleSort('warranty_end_date')}
                      >
                        Expires {sortBy === 'warranty_end_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {filteredWarranties.map((warranty) => (
                      <motion.tr
                        key={warranty.id}
                        whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                        className="transition-all"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{warranty.products?.name || 'Unknown Product'}</div>
                          <div className="text-xs text-slate-500">SKU: {warranty.products?.sku || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{warranty.invoices?.invoice_number || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{formatDate(warranty.invoices?.invoice_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{warranty.invoices?.customers?.name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{warranty.invoices?.customers?.phone || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {warranty.serial_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {warranty.warranty_months || 0} months
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(warranty.warranty_end_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getWarrantyStatusColor(warranty.status)}`}
                          >
                            {getWarrantyStatusText(warranty)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => startEdit(warranty)}
                              className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                              title="Edit Warranty"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDelete(warranty)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                              title="Delete Warranty"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Edit Warranty Modal */}
      <AnimatePresence>
        {showEditModal && editingWarranty && (
          <Modal handleClose={() => {
            setShowEditModal(false);
            setEditingWarranty(null);
          }}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Edit Warranty</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {editingWarranty.products?.name || 'Unknown Product'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {editingWarranty.invoices?.invoice_number || 'N/A'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {editingWarranty.invoices?.customers?.name || 'Unknown'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={editingWarranty.serial_number || ''}
                    onChange={(e) => setEditingWarranty({
                      ...editingWarranty,
                      serial_number: e.target.value
                    })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="Enter serial number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Period (Months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={editingWarranty.warranty_months}
                    onChange={(e) => setEditingWarranty({
                      ...editingWarranty,
                      warranty_months: parseInt(e.target.value) || 0
                    })}
                    min="0"
                    max="120"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingWarranty(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEdit(editingWarranty)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Warranty'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && deletingWarranty && (
          <Modal handleClose={() => {
            setShowDeleteConfirm(false);
            setDeletingWarranty(null);
          }}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">Confirm Delete</h2>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the warranty record for{' '}
                <strong>{deletingWarranty.products?.name || 'Unknown Product'}</strong>?
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingWarranty(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Warranty'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpiryTracker;
