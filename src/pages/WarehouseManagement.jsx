import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
// ...existing code...
import WarehouseModal from '../components/WarehouseModal';
// ...existing code...
import WarehouseInventoryView from '../components/WarehouseInventoryView';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  // Fetch warehouses on component mount
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Fetch warehouses from the database
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data, error } = await getWarehouses();
      
      if (error) throw error;
      
      setWarehouses(data || []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new warehouse
  const handleAddWarehouse = () => {
    setShowAddModal(true);
  };

  // Handle editing a warehouse
  const handleEditWarehouse = (warehouse) => {
    setCurrentWarehouse(warehouse);
    setShowEditModal(true);
  };

  // Handle deleting a warehouse
  const handleDeleteWarehouse = (warehouse) => {
    setCurrentWarehouse(warehouse);
    setShowDeleteConfirm(true);
  };

  // Confirm warehouse deletion
  const confirmDeleteWarehouse = async () => {
    try {
      const { error } = await deleteWarehouse(currentWarehouse.id);
      
      if (error) throw error;
      
      // Refresh the warehouse list
      fetchWarehouses();
      setShowDeleteConfirm(false);
      setCurrentWarehouse(null);
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      setError(err.message);
    }
  };

  // Handle opening transfer modal
  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  // Handle viewing warehouse inventory
  const handleViewInventory = (warehouse) => {
    setCurrentWarehouse(warehouse);
    setShowInventoryModal(true);
  };

  // Filter warehouses based on search term and active status
  const filteredWarehouses = warehouses.filter((warehouse) => {
    const matchesSearch = warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (warehouse.location && warehouse.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeStatus === 'all') {
      return matchesSearch;
    }
    
    return matchesSearch && warehouse.is_active === (activeStatus === 'active');
  });

  // Refresh after operations
  const handleOperationComplete = () => {
    fetchWarehouses();
  };

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Warehouse Management</h1>
        <div>
          <button 
            className="btn-primary"
            onClick={handleAddWarehouse}
          >
            Add Warehouse
          </button>
          <button 
            className="btn-secondary ml-4"
            onClick={handleTransfer}
          >
            Transfer Inventory
          </button>
        </div>
      </motion.div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-lg shadow">
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </motion.div>
      )}

      {/* Warehouses list */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Location
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contact
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWarehouses.length > 0 ? (
              filteredWarehouses.map((warehouse) => (
                <motion.tr 
                  key={warehouse.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{warehouse.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{warehouse.location || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {warehouse.contact_person ? (
                        <>
                          <div>{warehouse.contact_person}</div>
                          {warehouse.phone && <div className="text-xs">{warehouse.phone}</div>}
                        </>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        warehouse.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {warehouse.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewInventory(warehouse)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Inventory
                    </button>
                    <button
                      onClick={() => handleEditWarehouse(warehouse)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteWarehouse(warehouse)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  {loading 
                    ? 'Loading warehouses...' 
                    : searchTerm || activeStatus !== 'all' 
                      ? 'No warehouses match your search criteria.' 
                      : 'No warehouses found. Add a warehouse to get started.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Warehouse Modal */}
        {showAddModal && (
          <WarehouseModal
            onClose={() => setShowAddModal(false)}
            onWarehouseAdded={handleOperationComplete}
          />
        )}

        {/* Edit Warehouse Modal */}
        {showEditModal && currentWarehouse && (
          <WarehouseModal
            warehouse={currentWarehouse}
            onClose={() => {
              setShowEditModal(false);
              setCurrentWarehouse(null);
            }}
            onWarehouseUpdated={handleOperationComplete}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Warehouse</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete the warehouse "{currentWarehouse?.name}"? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={confirmDeleteWarehouse}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setCurrentWarehouse(null);
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Transfer Modal */}
        {/* WarehouseTransfer removed */}

        {/* Inventory View Modal */}
        {showInventoryModal && currentWarehouse && (
          <WarehouseInventoryView
            warehouse={currentWarehouse}
            onClose={() => {
              setShowInventoryModal(false);
              setCurrentWarehouse(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarehouseManagement;
