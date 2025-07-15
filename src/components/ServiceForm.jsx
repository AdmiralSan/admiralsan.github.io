import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const ServiceForm = ({ serviceRecord, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_item_id: null,
    product_id: '',
    serial_number: '',
    issue_description: '',
    diagnosis: '',
    service_status: 'received',
    is_warranty_claim: false,
    service_cost: 0,
    parts_cost: 0,
    total_cost: 0,
    promised_date: '',
    technician_notes: '',
    customer_notes: ''
  });
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchSerial, setSearchSerial] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch customers, products, and customer purchase history on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch customers
      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      setCustomers(customersData || []);
      setProducts(productsData || []);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  // If editing an existing record, populate the form
  useEffect(() => {
    if (serviceRecord) {
      setFormData({
        customer_id: serviceRecord.customer_id || '',
        invoice_item_id: serviceRecord.invoice_item_id || null,
        product_id: serviceRecord.product_id || '',
        serial_number: serviceRecord.serial_number || '',
        issue_description: serviceRecord.issue_description || '',
        diagnosis: serviceRecord.diagnosis || '',
        service_status: serviceRecord.service_status || 'received',
        is_warranty_claim: serviceRecord.is_warranty_claim || false,
        service_cost: serviceRecord.service_cost || 0,
        parts_cost: serviceRecord.parts_cost || 0,
        total_cost: serviceRecord.total_cost || 0,
        promised_date: serviceRecord.promised_date ? new Date(serviceRecord.promised_date).toISOString().split('T')[0] : '',
        technician_notes: serviceRecord.technician_notes || '',
        customer_notes: serviceRecord.customer_notes || ''
      });
      
      // Fetch invoice items for this customer
      if (serviceRecord.customer_id) {
        fetchCustomerPurchases(serviceRecord.customer_id);
      }
    }
  }, [serviceRecord]);

  // When customer changes, fetch their purchase history
  useEffect(() => {
    if (formData.customer_id) {
      fetchCustomerPurchases(formData.customer_id);
    } else {
      setInvoiceItems([]);
    }
  }, [formData.customer_id]);

  // When invoice item changes, update product and serial number
  useEffect(() => {
    if (formData.invoice_item_id) {
      const selectedItem = invoiceItems.find(item => item.id === formData.invoice_item_id);
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          product_id: selectedItem.product_id,
          serial_number: selectedItem.serial_number || '',
          is_warranty_claim: isUnderWarranty(selectedItem)
        }));
      }
    }
  }, [formData.invoice_item_id, invoiceItems]);

  // Calculate total cost when service or parts cost changes
  useEffect(() => {
    const serviceCost = parseFloat(formData.service_cost) || 0;
    const partsCost = parseFloat(formData.parts_cost) || 0;
    setFormData(prev => ({
      ...prev,
      total_cost: serviceCost + partsCost
    }));
  }, [formData.service_cost, formData.parts_cost]);

  const fetchCustomerPurchases = async (customerId) => {
    const { data } = await supabase
      .from('invoice_items')
      .select(`
        id,
        invoice_id,
        product_id,
        serial_number,
        warranty_months,
        warranty_end_date,
        products(name),
        invoices(invoice_date, invoice_number)
      `)
      .eq('invoices.customer_id', customerId)
      .order('invoices.invoice_date', { ascending: false });
    
    setInvoiceItems(data || []);
  };

  const isUnderWarranty = (item) => {
    if (!item.warranty_end_date) return false;
    const today = new Date();
    const warrantyEnd = new Date(item.warranty_end_date);
    return today <= warrantyEnd;
  };

  const handleSerialSearch = async () => {
    if (!searchSerial.trim()) return;
    
    const { data } = await supabase
      .from('invoice_items')
      .select(`
        id,
        invoice_id,
        product_id,
        serial_number,
        warranty_months,
        warranty_end_date,
        products(name),
        invoices(invoice_date, invoice_number, customer_id)
      `)
      .eq('serial_number', searchSerial.trim())
      .single();
    
    if (data) {
      setFormData(prev => ({
        ...prev,
        customer_id: data.invoices.customer_id,
        invoice_item_id: data.id,
        product_id: data.product_id,
        serial_number: data.serial_number,
        is_warranty_claim: isUnderWarranty(data)
      }));
    } else {
      alert('No purchase record found for this serial number.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.customer_id) errors.customer_id = 'Customer is required';
    if (!formData.product_id) errors.product_id = 'Product is required';
    if (!formData.issue_description) errors.issue_description = 'Issue description is required';
    if (!formData.service_status) errors.service_status = 'Service status is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-xl font-semibold mb-4">
        {serviceRecord ? 'Edit Service Record' : 'Create New Service Record'}
      </h2>
      
      {/* Serial Number Quick Search */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Search by Serial Number</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter serial number"
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
            value={searchSerial}
            onChange={(e) => setSearchSerial(e.target.value)}
          />
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={handleSerialSearch}
          >
            Search
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className={`w-full border ${validationErrors.customer_id ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2`}
              required
            >
              <option value="">Select Customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
            {validationErrors.customer_id && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.customer_id}</p>
            )}
          </div>
          
          {/* Purchase History (if customer selected) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Previous Purchase (Optional)
            </label>
            <select
              name="invoice_item_id"
              value={formData.invoice_item_id || ''}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            >
              <option value="">Select Previous Purchase</option>
              {invoiceItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.products.name} - Invoice #{item.invoices.invoice_number} - {new Date(item.invoices.invoice_date).toLocaleDateString()}
                  {item.serial_number ? ` (S/N: ${item.serial_number})` : ''}
                  {isUnderWarranty(item) ? ' - Under Warranty' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className={`w-full border ${validationErrors.product_id ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2`}
              required
            >
              <option value="">Select Product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
            {validationErrors.product_id && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.product_id}</p>
            )}
          </div>
          
          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              placeholder="Enter device serial number"
            />
          </div>
          
          {/* Issue Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="issue_description"
              value={formData.issue_description}
              onChange={handleChange}
              rows={3}
              className={`w-full border ${validationErrors.issue_description ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2`}
              placeholder="Describe the problem with the device"
              required
            />
            {validationErrors.issue_description && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.issue_description}</p>
            )}
          </div>
          
          {/* Diagnosis (if service record exists) */}
          {serviceRecord && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis
              </label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2"
                placeholder="Technical diagnosis of the issue"
              />
            </div>
          )}
          
          {/* Service Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="service_status"
              value={formData.service_status}
              onChange={handleChange}
              className={`w-full border ${validationErrors.service_status ? 'border-red-500' : 'border-slate-200'} rounded-lg px-3 py-2`}
              required
            >
              <option value="received">Received</option>
              <option value="diagnosed">Diagnosed</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_parts">Waiting for Parts</option>
              <option value="completed">Completed</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {validationErrors.service_status && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.service_status}</p>
            )}
          </div>
          
          {/* Warranty Claim */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_warranty_claim"
              name="is_warranty_claim"
              checked={formData.is_warranty_claim}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_warranty_claim" className="ml-2 block text-sm text-gray-700">
              Warranty Claim
            </label>
          </div>
          
          {/* Promised Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Promised Completion Date
            </label>
            <input
              type="date"
              name="promised_date"
              value={formData.promised_date}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>
          
          {/* Service Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Cost
            </label>
            <input
              type="number"
              name="service_cost"
              value={formData.service_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>
          
          {/* Parts Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parts Cost
            </label>
            <input
              type="number"
              name="parts_cost"
              value={formData.parts_cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
            />
          </div>
          
          {/* Total Cost (calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Cost
            </label>
            <input
              type="number"
              name="total_cost"
              value={formData.total_cost}
              readOnly
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2"
            />
          </div>
          
          {/* Technician Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician Notes
            </label>
            <textarea
              name="technician_notes"
              value={formData.technician_notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              placeholder="Internal notes about repairs (not visible to customer)"
            />
          </div>
          
          {/* Customer Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Notes
            </label>
            <textarea
              name="customer_notes"
              value={formData.customer_notes}
              onChange={handleChange}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2"
              placeholder="Notes for the customer receipt"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Saving...' : (serviceRecord ? 'Update Service Record' : 'Create Service Record')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ServiceForm;