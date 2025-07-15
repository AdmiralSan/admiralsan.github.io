    import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createWarehouse, updateWarehouse } from '../utils/warehouseUtils';
import { supabase } from '../supabaseClient';

const WarehouseModal = ({ warehouse = null, onClose, onWarehouseAdded, onWarehouseUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If warehouse is provided, this is an edit operation
  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || '',
        location: warehouse.location || '',
        contact_person: warehouse.contact_person || '',
        phone: warehouse.phone || '',
        email: warehouse.email || '',
        address: warehouse.address || '',
        is_active: warehouse.is_active !== false,
        notes: warehouse.notes || ''
      });
    }
  }, [warehouse]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // No authentication needed
      // Use a dummy user ID or no user ID for created_by
      const warehouseData = {
        ...formData
        // created_by field is optional now
      };

      let result;
      if (warehouse) {
        // Update existing warehouse
        result = await updateWarehouse(warehouse.id, warehouseData);
        if (result.error) throw result.error;
        onWarehouseUpdated && onWarehouseUpdated();
      } else {
        // Create new warehouse
        result = await createWarehouse(warehouseData);
        if (result.error) throw result.error;
        onWarehouseAdded && onWarehouseAdded();
      }

      onClose();
    } catch (err) {
      console.error('Error saving warehouse:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity pointer-events-none"></div>
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle relative z-50 pointer-events-auto"
        >
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
                  </h3>
                  <div className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md form-input"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="contact_person"
                          id="contact_person"
                          value={formData.contact_person}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md form-input"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md form-input"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md form-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        rows="2"
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md form-input"
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        id="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md form-input"
                      ></textarea>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                  {error && (
                    <div className="mt-4 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? 'Saving...' : warehouse ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WarehouseModal;
