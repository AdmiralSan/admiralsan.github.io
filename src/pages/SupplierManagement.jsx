import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const SupplierForm = ({ onSupplierAdded, initialSupplier = null, onCancel = null }) => {
  const initialFormState = {
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialSupplier) {
      setFormData(initialSupplier);
    }
  }, [initialSupplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (initialSupplier) {
        // Update existing supplier
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', initialSupplier.id);
        if (error) throw error;
      } else {
        // Create new supplier
        const { error } = await supabase.from('suppliers').insert([formData]);
        if (error) throw error;
        setFormData(initialFormState);
      }

      setSuccess(true);
      if (onSupplierAdded) onSupplierAdded();
      setTimeout(() => setSuccess(false), 1800);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h2 className="text-xl font-semibold text-slate-800 mb-6 tracking-tight">
        {initialSupplier ? 'Edit Supplier' : 'Add New Supplier'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
              value={formData.name}
              onChange={handleChange}
              placeholder=" "
              required
            />
            <label
              htmlFor="name"
              className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
            >
              Supplier Name
            </label>
          </div>
          <div className="relative">
            <input
              id="contact_person"
              name="contact_person"
              type="text"
              className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder=" "
            />
            <label
              htmlFor="contact_person"
              className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
            >
              Contact Person
            </label>
          </div>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
              value={formData.email}
              onChange={handleChange}
              placeholder=" "
              required
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
            >
              Email
            </label>
          </div>
          <div className="relative">
            <input
              id="phone"
              name="phone"
              type="tel"
              className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
              value={formData.phone}
              onChange={handleChange}
              placeholder=" "
            />
            <label
              htmlFor="phone"
              className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
            >
              Phone Number
            </label>
          </div>
        </div>
        <div className="relative">
          <input
            id="address"
            name="address"
            type="text"
            className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent"
            value={formData.address}
            onChange={handleChange}
            placeholder=" "
          />
          <label
            htmlFor="address"
            className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
          >
            Address
          </label>
        </div>
        <div className="relative">
          <textarea
            id="notes"
            name="notes"
            rows="2"
            className="peer w-full mt-1 bg-transparent border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 p-3 text-base text-slate-800 placeholder-transparent resize-none"
            value={formData.notes}
            onChange={handleChange}
            placeholder=" "
          />
          <label
            htmlFor="notes"
            className="absolute left-3 top-2.5 text-slate-400 text-sm pointer-events-none transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2.5 peer-focus:text-sm bg-white px-1"
          >
            Notes
          </label>
        </div>
        {error && (
          <motion.div
            className="text-red-500 text-sm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            Error: {error}
          </motion.div>
        )}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <motion.button
            type="submit"
            className="btn-primary"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
          >
            <AnimatePresence mode="wait" initial={false}>
              {loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                />
              ) : success ? (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-block w-5 h-5 text-white"
                >
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  {initialSupplier ? 'Update Supplier' : 'Add Supplier'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

const SupplierList = ({ onEditSupplier }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('suppliers').select('*');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        fetchSuppliers();
      } catch (err) {
        alert('Error deleting supplier: ' + err.message);
      }
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading)
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

  if (error)
    return (
      <motion.div
        className="bg-red-50 border border-red-200 rounded-md p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-red-600">Error: {error}</p>
      </motion.div>
    );

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Supplier List</h2>
        <input
          type="text"
          placeholder="Search suppliers..."
          className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <AnimatePresence>
        {filteredSuppliers.length === 0 ? (
          <motion.p
            className="text-slate-500 text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No suppliers found.
          </motion.p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Supplier Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <motion.tr
                    key={supplier.id}
                    whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                    className="transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{supplier.name}</div>
                      {supplier.address && (
                        <div className="text-xs text-slate-400 mt-1">{supplier.address}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{supplier.contact_person || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {supplier.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {supplier.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
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
    </motion.div>
  );
};

const SupplierManagement = () => {
  const [refreshSuppliers, setRefreshSuppliers] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSupplierAdded = () => {
    setRefreshSuppliers(!refreshSuppliers);
    setEditingSupplier(null);
    setShowAddForm(false);
  };

  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingSupplier(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center space-x-2 transition-colors"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
            ></path>
          </svg>
          <span>{showAddForm ? "Cancel" : "Add Supplier"}</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
              <SupplierForm
                onSupplierAdded={handleSupplierAdded}
                initialSupplier={editingSupplier}
                onCancel={handleCancelEdit}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full">
        <SupplierList
          key={refreshSuppliers}
          onEditSupplier={handleEditSupplier}
        />
      </div>
    </div>
  );
};

export default SupplierManagement;
