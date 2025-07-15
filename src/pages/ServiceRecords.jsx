import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceForm from '../components/ServiceForm';

const tableVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

// Modal background overlay
const Backdrop = ({ children, onClick }) => (
  <motion.div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center overflow-y-auto p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Modal container
const Modal = ({ children, handleClose }) => {
  return (
    <AnimatePresence>
      <Backdrop onClick={handleClose}>
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {children}
        </motion.div>
      </Backdrop>
    </AnimatePresence>
  );
};

const ServiceStatusBadge = ({ status }) => {
  const statusStyles = {
    received: "bg-blue-100 text-blue-800",
    diagnosed: "bg-purple-100 text-purple-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    waiting_for_parts: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    delivered: "bg-slate-100 text-slate-800",
    cancelled: "bg-red-100 text-red-800"
  };

  const statusText = {
    received: "Received",
    diagnosed: "Diagnosed",
    in_progress: "In Progress",
    waiting_for_parts: "Waiting for Parts",
    completed: "Completed",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };

  return (
    <span className={`${statusStyles[status] || "bg-slate-100"} px-2 py-1 rounded-full text-xs font-medium`}>
      {statusText[status] || status}
    </span>
  );
};

const ServiceRecords = () => {
  const [serviceRecords, setServiceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [warrantyFilter, setWarrantyFilter] = useState('');
  const [sortField, setSortField] = useState('received_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  const fetchServiceRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          customers (
            id, name, phone, email
          ),
          products (
            id, name, sku
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceRecords();
  }, [sortField, sortDirection]);

  const handleCreateService = async (formData) => {
    try {
      // Generate a unique service number
      const serviceNumber = `SRV-${Date.now().toString().substring(6)}`;
      
      const { data, error } = await supabase
        .from('service_records')
        .insert([
          { 
            service_number: serviceNumber,
            ...formData 
          }
        ])
        .select();

      if (error) throw error;
      
      setShowAddModal(false);
      fetchServiceRecords();
      return data;
    } catch (error) {
      console.error('Error creating service record:', error);
      alert(`Error creating service record: ${error.message}`);
    }
  };

  const handleUpdateService = async (formData) => {
    try {
      const { error } = await supabase
        .from('service_records')
        .update(formData)
        .eq('id', recordToEdit.id);

      if (error) throw error;
      
      setRecordToEdit(null);
      fetchServiceRecords();
    } catch (error) {
      console.error('Error updating service record:', error);
      alert(`Error updating service record: ${error.message}`);
    }
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to newest first when changing fields
    }
  };

  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEditRecord = (record) => {
    setRecordToEdit(record);
  };

  const filteredRecords = serviceRecords.filter(record => {
    // Search filter
    const searchMatch = 
      record.service_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.issue_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusMatch = !statusFilter || record.service_status === statusFilter;
    
    // Warranty filter
    const warrantyMatch = 
      warrantyFilter === '' || 
      (warrantyFilter === 'warranty' && record.is_warranty_claim) ||
      (warrantyFilter === 'non-warranty' && !record.is_warranty_claim);
    
    // Date range filter
    let dateMatch = true;
    if (dateRange.startDate) {
      const recordDate = new Date(record.received_date);
      const startDate = new Date(dateRange.startDate);
      dateMatch = recordDate >= startDate;
    }
    if (dateRange.endDate && dateMatch) {
      const recordDate = new Date(record.received_date);
      const endDate = new Date(dateRange.endDate);
      // Set time to end of day
      endDate.setHours(23, 59, 59, 999);
      dateMatch = recordDate <= endDate;
    }
    
    return searchMatch && statusMatch && warrantyMatch && dateMatch;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
    setWarrantyFilter('');
  };

  if (loading && serviceRecords.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className="bg-red-50 border border-red-200 rounded-md p-4" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
      >
        <p className="text-red-600">Error: {error}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Header and Create Button */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight mr-4">Service Records</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center transition-colors"
            onClick={() => setShowAddModal(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Service Record
          </motion.button>
        </div>
        <input
          type="text"
          placeholder="Search service records..."
          className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="received">Received</option>
            <option value="diagnosed">Diagnosed</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_parts">Waiting for Parts</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="warranty-filter" className="block text-sm font-medium text-slate-700 mb-1">
            Warranty
          </label>
          <select
            id="warranty-filter"
            className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={warrantyFilter}
            onChange={(e) => setWarrantyFilter(e.target.value)}
          >
            <option value="">All Claims</option>
            <option value="warranty">Warranty Claims</option>
            <option value="non-warranty">Non-Warranty</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="start-date"
            className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="end-date"
            className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>
      
      {/* Reset Filters Button */}
      {(searchTerm || statusFilter || warrantyFilter || dateRange.startDate || dateRange.endDate) && (
        <div className="flex justify-end">
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset Filters
          </button>
        </div>
      )}

      {/* Service Records Table */}
      <AnimatePresence>
        {filteredRecords.length === 0 ? (
          <motion.p
            className="text-slate-500 text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No service records found.
          </motion.p>
        ) : (
          <motion.div
            className="overflow-x-auto"
            variants={tableVariants}
            initial="hidden"
            animate="visible"
          >
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    { label: 'Service #', field: 'service_number' },
                    { label: 'Customer', field: null },
                    { label: 'Product', field: null },
                    { label: 'Serial #', field: 'serial_number' },
                    { label: 'Status', field: 'service_status' },
                    { label: 'Received Date', field: 'received_date' },
                    { label: 'Warranty', field: 'is_warranty_claim' },
                    { label: 'Total Cost', field: 'total_cost' },
                    { label: 'Actions', field: null },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider select-none ${col.field ? 'hover:text-blue-600 transition-colors cursor-pointer' : ''}`}
                      onClick={col.field ? () => handleSort(col.field) : undefined}
                    >
                      {col.label} {col.field && sortField === col.field && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody
                className="bg-white divide-y divide-slate-100"
                variants={tableVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredRecords.map((record) => (
                  <motion.tr
                    key={record.id}
                    variants={rowVariants}
                    whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                    className="transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer" onClick={() => handleViewRecord(record)}>
                        {record.service_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{record.customers?.name}</div>
                      <div className="text-xs text-slate-500">{record.customers?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{record.products?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{record.serial_number || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ServiceStatusBadge status={record.service_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {new Date(record.received_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {record.is_warranty_claim ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span>No</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        ₹{record.total_cost.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewRecord(record)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditRecord(record)}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        Edit
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Service Record Modal */}
      <AnimatePresence>
        {showAddModal && (
          <Modal handleClose={() => setShowAddModal(false)}>
            <div className="p-6">
              <ServiceForm 
                onSubmit={handleCreateService}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Service Record Modal */}
      <AnimatePresence>
        {recordToEdit && (
          <Modal handleClose={() => setRecordToEdit(null)}>
            <div className="p-6">
              <ServiceForm 
                serviceRecord={recordToEdit}
                onSubmit={handleUpdateService}
                onCancel={() => setRecordToEdit(null)}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* View Service Record Modal */}
      <AnimatePresence>
        {showViewModal && selectedRecord && (
          <Modal handleClose={() => setShowViewModal(false)}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Service Record {selectedRecord.service_number}</h2>
                  <p className="text-slate-500 mt-1">
                    Received on {new Date(selectedRecord.received_date).toLocaleDateString()}
                  </p>
                </div>
                <ServiceStatusBadge status={selectedRecord.service_status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Customer Information</h3>
                  <p className="text-base font-medium">{selectedRecord.customers?.name}</p>
                  <p className="text-sm text-slate-700">{selectedRecord.customers?.phone}</p>
                  <p className="text-sm text-slate-700">{selectedRecord.customers?.email}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Device Information</h3>
                  <p className="text-base font-medium">{selectedRecord.products?.name}</p>
                  <p className="text-sm text-slate-700">SKU: {selectedRecord.products?.sku || 'N/A'}</p>
                  <p className="text-sm text-slate-700">Serial Number: {selectedRecord.serial_number || 'Not recorded'}</p>
                  <p className="text-sm mt-1">
                    {selectedRecord.is_warranty_claim ? (
                      <span className="text-green-600 font-medium">Under Warranty</span>
                    ) : (
                      <span className="text-slate-700">Not a warranty claim</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 mb-2">Issue Description</h3>
                <div className="bg-slate-50 p-3 rounded-lg text-slate-800">
                  {selectedRecord.issue_description || 'No description provided'}
                </div>
              </div>

              {selectedRecord.diagnosis && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Diagnosis</h3>
                  <div className="bg-slate-50 p-3 rounded-lg text-slate-800">
                    {selectedRecord.diagnosis}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Service Cost</h3>
                  <p className="text-lg font-medium">₹{selectedRecord.service_cost.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Parts Cost</h3>
                  <p className="text-lg font-medium">₹{selectedRecord.parts_cost.toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Total Cost</h3>
                  <p className="text-lg font-medium text-blue-600">${selectedRecord.total_cost.toFixed(2)}</p>
                </div>
              </div>

              {selectedRecord.technician_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Technician Notes (Internal)</h3>
                  <div className="bg-yellow-50 p-3 rounded-lg text-slate-800 border border-yellow-100">
                    {selectedRecord.technician_notes}
                  </div>
                </div>
              )}

              {selectedRecord.customer_notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-500 mb-2">Customer Notes</h3>
                  <div className="bg-slate-50 p-3 rounded-lg text-slate-800">
                    {selectedRecord.customer_notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditRecord(selectedRecord);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Edit Record
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceRecords;