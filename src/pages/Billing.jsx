










import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerForm from '../components/CustomerForm';
import InvoiceTemplate from '../components/InvoiceTemplate';
import PaymentModal from '../components/PaymentModal';
import CustomerAccountStatement from '../components/CustomerAccountStatement';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import printJS from 'print-js';
import html2canvas from 'html2canvas';
import ReactDOM from 'react-dom/client';
import { useTemplate } from '../contexts/TemplateContext';
import { billingAccountsIntegration } from '../utils/billingAccountsIntegration';

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

const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [sortField, setSortField] = useState('invoice_date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showEditInvoiceModal, setShowEditInvoiceModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAccountStatement, setShowAccountStatement] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [accountsSummary, setAccountsSummary] = useState(null);
  
  // Batch printing state
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [batchDateFilter, setBatchDateFilter] = useState('all'); // all, thisWeek, thisMonth, thisYear
  
  // New invoice state
  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: '',
    payment_status: 'pending',
    payment_method: '',
    notes: '',
    items: [],
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
    amount_paid: 0, // For tracking partial payments
    warranty_provided: false // New field for warranty checkbox
  });
  
  // For customer modal
  const [customerToEdit, setCustomerToEdit] = useState(null);
  
  // For invoice printing
  const invoicePrintRef = useRef();
  
  // Use global template context
  const { templateData } = useTemplate();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
            serial_number, warranty_months, warranty_end_date,
            products (name, sku)
          )
        `)
        .order(sortField, { ascending: sortDirection === 'asc' });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants (
            id, attribute_name, value, price_adjustment, stock, sku
          )
        `)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAccountsSummary = async () => {
    try {
      const summary = await billingAccountsIntegration.getBillingAccountSummary();
      setAccountsSummary(summary);
    } catch (error) {
      console.error('Error fetching accounts summary:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
    fetchAccountsSummary();
  }, [sortField, sortDirection]);
  
  // Check if we have an invoice ID to edit from location state
  useEffect(() => {
    const checkForInvoiceToEdit = async () => {
      if (location.state?.editInvoiceId) {
        const invoiceId = location.state.editInvoiceId;
        console.log("Received invoice ID to edit:", invoiceId);
        
        // Clear the location state to avoid opening the edit modal again on page refresh
        navigate(location.pathname, { replace: true });
        
        try {
          // Directly fetch the invoice - more reliable than searching the loaded invoices
          await fetchInvoiceForEdit(invoiceId);
        } catch (error) {
          console.error("Error fetching invoice to edit:", error);
          alert("Could not load the invoice for editing. Please try again.");
        }
      }
    };
    
    checkForInvoiceToEdit();
  }, [location.state, navigate]);
  
  // Filter invoices based on search term, date range, and payment status
  const filteredInvoices = invoices.filter(invoice => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.payment_status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date range filter
    const invoiceDate = new Date(invoice.invoice_date);
    const afterStartDate = !dateRange.startDate || invoiceDate >= new Date(dateRange.startDate);
    const beforeEndDate = !dateRange.endDate || invoiceDate <= new Date(dateRange.endDate + 'T23:59:59');
    
    // Payment status filter
    const matchesPaymentStatus = !paymentStatusFilter || invoice.payment_status === paymentStatusFilter;
    
    return matchesSearch && afterStartDate && beforeEndDate && matchesPaymentStatus;
  });

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to newest first when changing fields
    }
  };

  const handlePaymentComplete = async (invoiceId, paymentMethod, amountPaid, paymentStatus) => {
    try {
      // Refresh invoices to show updated payment status
      await fetchInvoices();
      
      // Refresh accounts summary
      await fetchAccountsSummary();
      
      // Show success message with payment information
      if (paymentStatus === 'partial') {
        alert(`Partial payment of ₹${parseFloat(amountPaid).toFixed(2)} recorded successfully!`);
      } else {
        alert('Full payment recorded successfully and account entries created!');
      }
    } catch (error) {
      console.error('Error handling payment completion:', error);
    }
  };

  const handleViewAccountStatement = (customer) => {
    setSelectedCustomer(customer);
    setShowAccountStatement(true);
  };
  
  // Toggle invoice selection for batch actions
  const toggleInvoiceSelection = (invoiceId) => {
    setSelectedInvoices(prev => {
      if (prev.includes(invoiceId)) {
        return prev.filter(id => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };
  
  // Select all invoices for batch actions
  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map(invoice => invoice.id));
    }
  };
  
  // Apply date-based filter for batch operations
  const applyBatchDateFilter = () => {
    const today = new Date();
    let startDate = new Date(0); // Default to earliest possible date
    
    if (batchDateFilter === 'thisWeek') {
      // Get first day of this week (Sunday)
      const firstDay = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day;
      firstDay.setDate(diff);
      firstDay.setHours(0, 0, 0, 0);
      startDate = firstDay;
    } else if (batchDateFilter === 'thisMonth') {
      // Get first day of this month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (batchDateFilter === 'thisYear') {
      // Get first day of this year
      startDate = new Date(today.getFullYear(), 0, 1);
    }
    
    // Select invoices based on date filter
    const filteredIds = filteredInvoices
      .filter(invoice => new Date(invoice.invoice_date) >= startDate)
      .map(invoice => invoice.id);
    
    setSelectedInvoices(filteredIds);
  };
  
  // Generate separate PDFs for each invoice in the batch
  const handleBatchPdfDownload = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice to download');
      return;
    }
    
    try {
      setLoading(true);
      
      // For each selected invoice
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoiceId = selectedInvoices[i];
        
        // Fetch complete invoice data
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (
              id, name, phone, email, address
            ),
            invoice_items (
              id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
              serial_number, warranty_months, warranty_end_date,
              products (name, sku)
            )
          `)
          .eq('id', invoiceId)
          .single();
        
        if (error) throw error;
        
        // Create temporary div to render invoice
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Render the invoice to the div
        const root = ReactDOM.createRoot(tempDiv);
        root.render(<InvoiceTemplate invoice={invoice} companyDetails={templateData} />);
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Capture the rendered invoice as an image
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        // Create a new PDF document for this invoice
        const doc = new jsPDF();
        
        // Add the image to the PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        // Save this PDF with a unique name
        const fileName = `Invoice_${invoice.invoice_number}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        // Clean up
        document.body.removeChild(tempDiv);
        
        // Small delay between downloads to prevent browser issues
        if (i < selectedInvoices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      alert(`${selectedInvoices.length} invoice PDF(s) have been downloaded.`);
      
    } catch (err) {
      console.error('Error generating PDFs:', err);
      alert('Error generating PDFs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Batch print invoices
  const handleBatchPrint = async () => {
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice to print');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create HTML content for all selected invoices
      let printContent = '<div class="invoice-batch-print">';
      
      // For each selected invoice
      for (let i = 0; i < selectedInvoices.length; i++) {
        const invoiceId = selectedInvoices[i];
        
        // Fetch complete invoice data
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (
              id, name, phone, email, address
            ),
            invoice_items (
              id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
              serial_number, warranty_months, warranty_end_date,
              products (name, sku)
            )
          `)
          .eq('id', invoiceId)
          .single();
        
        if (error) throw error;
        
        // Create temporary div to render invoice
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        // Render the invoice to the div
        const root = ReactDOM.createRoot(tempDiv);
        root.render(<InvoiceTemplate invoice={invoice} companyDetails={templateData} />);
        
        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Add the HTML content
        printContent += tempDiv.innerHTML;
        
        // Add page break if not the last invoice
        if (i < selectedInvoices.length - 1) {
          printContent += '<div style="page-break-after: always;"></div>';
        }
        
        // Clean up
        document.body.removeChild(tempDiv);
      }
      
      printContent += '</div>';
      
      // Use print-js to print the content
      printJS({
        printable: printContent,
        type: 'raw-html',
        documentTitle: 'Invoices',
        css: [
          '/src/index.css', // Adjust path as needed for your CSS
        ],
        onPrintDialogClose: () => {
          setLoading(false);
        }
      });
      
    } catch (err) {
      console.error('Error printing batch invoices:', err);
      alert('Error printing batch invoices. Please try again.');
      setLoading(false);
    }
  };

  const createCustomer = async (customerData) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select();

      if (error) throw error;
      
      await fetchCustomers();
      setShowCustomerModal(false);
      
      if (data && data[0]) {
        setInvoiceForm(prev => ({
          ...prev,
          customer_id: data[0].id
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      alert(`Error creating customer: ${error.message}`);
    }
  };

  const updateCustomer = async (customerData) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', customerToEdit.id);

      if (error) throw error;
      
      await fetchCustomers();
      setShowCustomerModal(false);
      setCustomerToEdit(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert(`Error updating customer: ${error.message}`);
    }
  };

  const handleCustomerSubmit = async (formData) => {
    if (customerToEdit) {
      return updateCustomer(formData);
    } else {
      return createCustomer(formData);
    }
  };

  const handleAddInvoiceItem = () => {
    setInvoiceForm(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now(), // temporary id for UI
        product_id: '',
        variant_id: null,
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 0,
        serial_number: '',
        warranty_months: 0
      }]
    }));
  };

  const handleRemoveInvoiceItem = (index) => {
    setInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleInvoiceItemChange = (index, field, value) => {
    setInvoiceForm(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      
      // If product changes, update unit price
      if (field === 'product_id') {
        const product = products.find(p => p.id === value);
        if (product) {
          newItems[index].unit_price = product.price;
        }
      }
      
      // If variant changes, adjust price
      if (field === 'variant_id' && value) {
        const product = products.find(p => p.id === newItems[index].product_id);
        if (product) {
          const variant = product.product_variants.find(v => v.id === value);
          if (variant) {
            const basePrice = product.price;
            newItems[index].unit_price = basePrice + (variant.price_adjustment || 0);
          }
        }
      }
      
      return {
        ...prev,
        items: newItems
      };
    });
  };

  // Calculate invoice totals when items change
  useEffect(() => {
    let subtotal = 0;
    
    invoiceForm.items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      const discountAmount = lineTotal * (item.discount_percent / 100) || 0;
      subtotal += lineTotal - discountAmount;
    });
    
    const taxAmount = parseFloat(invoiceForm.tax_amount) || 0;
    const discountAmount = parseFloat(invoiceForm.discount_amount) || 0;
    const total = subtotal + taxAmount - discountAmount;
    
    setInvoiceForm(prev => ({
      ...prev,
      total_amount: Math.max(0, total)
    }));
  }, [invoiceForm.items, invoiceForm.tax_amount, invoiceForm.discount_amount]);

  const createInvoice = async () => {
    try {
      // Validate
      if (!invoiceForm.customer_id) {
        alert('Please select a customer');
        return;
      }
      
      if (invoiceForm.items.length === 0) {
        alert('Please add at least one item to the invoice');
        return;
      }
      
      for (const item of invoiceForm.items) {
        if (!item.product_id) {
          alert('All items must have a product selected');
          return;
        }
      }
      
      // Validate partial payment
      if (invoiceForm.payment_status === 'partial') {
        if (!invoiceForm.amount_paid || invoiceForm.amount_paid <= 0) {
          alert('Please enter a valid amount paid for partial payment');
          return;
        }
        if (invoiceForm.amount_paid > invoiceForm.total_amount) {
          alert('Amount paid cannot be greater than total amount');
          return;
        }
      }
      
      setLoading(true);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      
      // Create invoice with amount_paid for partial payments
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          customer_id: invoiceForm.customer_id,
          total_amount: invoiceForm.total_amount,
          discount_amount: invoiceForm.discount_amount || 0,
          tax_amount: invoiceForm.tax_amount || 0,
          payment_status: invoiceForm.payment_status,
          payment_method: invoiceForm.payment_method || null,
          notes: invoiceForm.notes || null,
          amount_paid: invoiceForm.payment_status === 'partial' ? invoiceForm.amount_paid : 
                       (invoiceForm.payment_status === 'paid' ? invoiceForm.total_amount : 0),
          warranty_provided: invoiceForm.warranty_provided // Include warranty field
        }])
        .select();
      
      if (invoiceError) throw invoiceError;
      
      // Create invoice items
      const invoiceItems = invoiceForm.items.map(item => ({
        invoice_id: invoice[0].id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        tax_percent: item.tax_percent || 0,
        serial_number: item.serial_number || null,
        warranty_months: item.warranty_months || 0
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
      
      // Create stock movements for each item
      const stockMovements = invoiceForm.items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: -item.quantity, // negative because it's outgoing
        movement_type: 'outgoing',
        reference_number: invoiceNumber,
        notes: `Sold in invoice ${invoiceNumber}`
      }));
      
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(stockMovements);
      
      if (movementError) throw movementError;
      
      // Create account entry for pending invoice
      try {
        const { data: fullInvoice } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (
              id, name, phone, email, address
            )
          `)
          .eq('id', invoice[0].id)
          .single();
        
        if (fullInvoice) {
          // Create pending ledger entry for the invoice
          await billingAccountsIntegration.createPendingLedgerEntry(fullInvoice);
          
          // If partial payment, also create payment ledger entry
          if (invoiceForm.payment_status === 'partial' && invoiceForm.amount_paid > 0) {
            await billingAccountsIntegration.createPartialPaymentLedgerEntry(
              fullInvoice, 
              invoiceForm.amount_paid, 
              invoiceForm.payment_method || 'cash'
            );
            await billingAccountsIntegration.createPartialPayment(
              fullInvoice, 
              invoiceForm.amount_paid, 
              invoiceForm.payment_method || 'cash'
            );
          } else if (invoiceForm.payment_status === 'paid') {
            // If fully paid, create payment ledger entry
            await billingAccountsIntegration.createLedgerEntryFromInvoice(
              fullInvoice, 
              invoiceForm.payment_method || 'cash'
            );
            await billingAccountsIntegration.createPaymentFromInvoice(
              fullInvoice, 
              invoiceForm.payment_method || 'cash'
            );
          }
        }
      } catch (accountError) {
        console.warn('Could not create account entry:', accountError);
        // Don't fail invoice creation if account entry fails
      }
      
      if (invoiceForm.warranty_provided) {
        // Add warranty details to the warranty page
        await supabase.from('warranty').insert(
          invoiceForm.items
            .filter(item => item.warranty_months > 0) // Only add items with warranty
            .map(item => ({
              product_id: item.product_id,
              warranty_months: item.warranty_months,
              invoice_id: invoice[0].id,
              serial_number: item.serial_number || null,
              variant_id: item.variant_id || null
            }))
        );
      }
      
      // Reset form and close modal
      setInvoiceForm({
        customer_id: '',
        payment_status: 'pending',
        payment_method: '',
        notes: '',
        items: [],
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        amount_paid: 0,
        warranty_provided: false // Reset warranty checkbox
      });
      
      setShowNewInvoiceModal(false);
      await fetchInvoices();
      await fetchAccountsSummary(); // Refresh accounts summary
      
      // Show the created invoice for printing
      const { data: fullInvoice } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
            serial_number, warranty_months, warranty_end_date,
            products (name, sku)
          )
        `)
        .eq('id', invoice[0].id)
        .single();
      
      setSelectedInvoice(fullInvoice);
      setShowInvoiceDetailModal(true);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(`Error creating invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (invoiceId) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // First, delete invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      // Delete warranty records if any
      const { error: warrantyError } = await supabase
        .from('warranty')
        .delete()
        .eq('invoice_id', invoiceId);

      if (warrantyError) throw warrantyError;

      // Delete stock movements related to this invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .delete()
          .eq('reference_number', invoice.invoice_number);

        if (movementError) throw movementError;
      }

      // Finally, delete the invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      // Refresh the invoices list
      await fetchInvoices();
      
      alert('Invoice deleted successfully');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert(`Error deleting invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceForEdit = async (invoiceId) => {
    try {
      setLoading(true);
      console.log("Fetching invoice for edit:", invoiceId);
      
      // Fetch complete invoice data with items directly (skip the two-step process)
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
            serial_number, warranty_months, warranty_end_date,
            products (name, sku)
          )
        `)
        .eq('id', invoiceId)
        .single();
        
      if (error) throw error;
      
      if (fullInvoice) {
        console.log("Invoice found, preparing edit form");
        
        // Set up the form with existing invoice data
        setEditingInvoice(fullInvoice);
        setInvoiceForm({
          customer_id: fullInvoice.customer_id,
          payment_status: fullInvoice.payment_status,
          payment_method: fullInvoice.payment_method || '',
          notes: fullInvoice.notes || '',
          items: fullInvoice.invoice_items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent || 0,
            tax_percent: item.tax_percent || 0,
            serial_number: item.serial_number || '',
            warranty_months: item.warranty_months || 0
          })),
          discount_amount: fullInvoice.discount_amount || 0,
          tax_amount: fullInvoice.tax_amount || 0,
          total_amount: fullInvoice.total_amount,
          amount_paid: fullInvoice.amount_paid || 0,
          warranty_provided: fullInvoice.warranty_provided || false
        });
        
        // Open the edit modal
        setShowEditInvoiceModal(true);
        console.log("Edit invoice modal should be open now");
      } else {
        console.error('Invoice not found');
        alert('Invoice not found');
      }
    } catch (error) {
      console.error('Error fetching invoice for editing:', error);
      alert(`Error fetching invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEditInvoice = async (invoice) => {
    try {
      setLoading(true);
      
      // Fetch complete invoice data with items
      const { data: fullInvoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            id, name, phone, email, address
          ),
          invoice_items (
            id, product_id, variant_id, quantity, unit_price, discount_percent, tax_percent, 
            serial_number, warranty_months, warranty_end_date,
            products (name, sku)
          )
        `)
        .eq('id', invoice.id)
        .single();

      if (error) throw error;

      // Set up the form with existing invoice data
      setEditingInvoice(fullInvoice);
      setInvoiceForm({
        customer_id: fullInvoice.customer_id,
        payment_status: fullInvoice.payment_status,
        payment_method: fullInvoice.payment_method || '',
        notes: fullInvoice.notes || '',
        items: fullInvoice.invoice_items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent || 0,
          tax_percent: item.tax_percent || 0,
          serial_number: item.serial_number || '',
          warranty_months: item.warranty_months || 0
        })),
        discount_amount: fullInvoice.discount_amount || 0,
        tax_amount: fullInvoice.tax_amount || 0,
        total_amount: fullInvoice.total_amount,
        amount_paid: fullInvoice.amount_paid || 0,
        warranty_provided: fullInvoice.warranty_provided || false
      });
      
      setShowEditInvoiceModal(true);
    } catch (error) {
      console.error('Error loading invoice for editing:', error);
      alert(`Error loading invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async () => {
    try {
      // Validate
      if (!invoiceForm.customer_id) {
        alert('Please select a customer');
        return;
      }
      
      if (invoiceForm.items.length === 0) {
        alert('Please add at least one item to the invoice');
        return;
      }
      
      for (const item of invoiceForm.items) {
        if (!item.product_id) {
          alert('All items must have a product selected');
          return;
        }
      }
      
      // Validate partial payment
      if (invoiceForm.payment_status === 'partial') {
        if (!invoiceForm.amount_paid || invoiceForm.amount_paid <= 0) {
          alert('Please enter a valid amount paid for partial payment');
          return;
        }
        if (invoiceForm.amount_paid > invoiceForm.total_amount) {
          alert('Amount paid cannot be greater than total amount');
          return;
        }
      }
      
      setLoading(true);
      
      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          customer_id: invoiceForm.customer_id,
          total_amount: invoiceForm.total_amount,
          discount_amount: invoiceForm.discount_amount || 0,
          tax_amount: invoiceForm.tax_amount || 0,
          payment_status: invoiceForm.payment_status,
          payment_method: invoiceForm.payment_method || null,
          notes: invoiceForm.notes || null,
          amount_paid: invoiceForm.payment_status === 'partial' ? invoiceForm.amount_paid : 
                       (invoiceForm.payment_status === 'paid' ? invoiceForm.total_amount : 0),
          warranty_provided: invoiceForm.warranty_provided
        })
        .eq('id', editingInvoice.id);
      
      if (invoiceError) throw invoiceError;
      
      // Delete existing invoice items
      const { error: deleteItemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', editingInvoice.id);
      
      if (deleteItemsError) throw deleteItemsError;
      
      // Create new invoice items
      const invoiceItems = invoiceForm.items.map(item => ({
        invoice_id: editingInvoice.id,
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        tax_percent: item.tax_percent || 0,
        serial_number: item.serial_number || null,
        warranty_months: item.warranty_months || 0
      }));
      
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);
      
      if (itemsError) throw itemsError;
      
      // Update stock movements - delete old ones and create new ones
      const { error: deleteMovementError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('reference_number', editingInvoice.invoice_number);
      
      if (deleteMovementError) throw deleteMovementError;
      
      const stockMovements = invoiceForm.items.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: -item.quantity, // negative because it's outgoing
        movement_type: 'outgoing',
        reference_number: editingInvoice.invoice_number,
        notes: `Sold in invoice ${editingInvoice.invoice_number} (Updated)`
      }));
      
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(stockMovements);
      
      if (movementError) throw movementError;
      
      // Update warranty records
      const { error: deleteWarrantyError } = await supabase
        .from('warranty')
        .delete()
        .eq('invoice_id', editingInvoice.id);
      
      if (deleteWarrantyError) throw deleteWarrantyError;
      
      if (invoiceForm.warranty_provided) {
        await supabase.from('warranty').insert(
          invoiceForm.items
            .filter(item => item.warranty_months > 0) // Only add items with warranty
            .map(item => ({
              product_id: item.product_id,
              warranty_months: item.warranty_months,
              invoice_id: editingInvoice.id,
              serial_number: item.serial_number || null,
              variant_id: item.variant_id || null
            }))
        );
      }
      
      // Reset form and close modal
      setInvoiceForm({
        customer_id: '',
        payment_status: 'pending',
        payment_method: '',
        notes: '',
        items: [],
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        amount_paid: 0,
        warranty_provided: false
      });
      
      setShowEditInvoiceModal(false);
      setEditingInvoice(null);
      await fetchInvoices();
      await fetchAccountsSummary(); // Refresh accounts summary
      
      alert('Invoice updated successfully');
      
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert(`Error updating invoice: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Primary print method using react-to-print
  const handlePrint = useReactToPrint({
    content: () => invoicePrintRef.current,
    onBeforeGetContent: () => {
      // Show a message that print is being prepared
      console.log("Preparing print document...");
      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log("Print completed or cancelled");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      alert("There was an error printing the invoice. Please try the alternative print method.");
      // Fall back to alternative print method
      handleAlternativePrint();
    },
    removeAfterPrint: true
  });
  
  // Alternative print method using print-js and html2canvas as fallback
  const handleAlternativePrint = () => {
    try {
      if (!selectedInvoice || !invoicePrintRef.current) {
        alert("Invoice information is not available");
        return;
      }
      
      // Show loading indicator
      setLoading(true);
      
      // Use html2canvas to render the invoice template to an image
      html2canvas(invoicePrintRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      }).then(canvas => {
        // Convert the canvas to a data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // Try to print using print-js
        try {
          printJS({
            printable: dataUrl,
            type: 'image',
            header: `Invoice #${selectedInvoice.invoice_number || 'N/A'}`,
            imageStyle: 'width:100%;',
            documentTitle: `Invoice #${selectedInvoice.invoice_number || 'N/A'}`,
            showModal: true,
            modalMessage: 'Preparing invoice for printing...'
          });
          console.log("Alternative print using print-js completed");
        } catch (printJsError) {
          console.error("Print-js method failed:", printJsError);
          
          // Fallback to a simpler method - open image in new window
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Invoice #${selectedInvoice.invoice_number || 'N/A'}</title>
                  <style>
                    body { margin: 0; padding: 0; text-align: center; }
                    img { max-width: 100%; height: auto; }
                    .print-btn { 
                      position: fixed; top: 10px; right: 10px; 
                      padding: 8px 16px; background: #4CAF50; 
                      color: white; border: none; border-radius: 4px;
                      cursor: pointer;
                    }
                    @media print {
                      .print-btn { display: none; }
                    }
                  </style>
                </head>
                <body>
                  <button class="print-btn" onclick="window.print()">Print</button>
                  <img src="${dataUrl}" alt="Invoice #${selectedInvoice.invoice_number || 'N/A'}" />
                </body>
              </html>
            `);
            printWindow.document.close();
          } else {
            // If popup blocked, try direct printing
            const tempImg = document.createElement('img');
            document.body.appendChild(tempImg);
            tempImg.onload = function() {
              window.print();
              document.body.removeChild(tempImg);
            };
            tempImg.src = dataUrl;
            tempImg.style.display = 'none';
          }
        }
        
        setLoading(false);
      }).catch(canvasError => {
        console.error("HTML2Canvas error:", canvasError);
        setLoading(false);
        // If html2canvas fails, fall back to simple PDF generation and print that
        try {
          createAndPrintSimplePDF();
        } catch (fallbackError) {
          console.error("All print methods failed:", fallbackError);
          alert("All print methods failed. Please try the browser's built-in print or download the PDF instead.");
        }
      });
    } catch (error) {
      console.error("Alternative print error:", error);
      setLoading(false);
      alert("Print failed. Please try downloading the PDF instead.");
    }
  };
  
  // Create and print a simple PDF as last resort
  const createAndPrintSimplePDF = () => {
    try {
      if (!selectedInvoice) return;
      
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Simple header
      doc.setFontSize(16);
      doc.text("Electronics Retail Shop", 14, 15);
      doc.setFontSize(10);
      doc.text("Invoice #" + (selectedInvoice.invoice_number || 'N/A'), 14, 25);
      
      // Customer info
      doc.text("Bill To:", 14, 35);
      if (selectedInvoice.customers && selectedInvoice.customers.name) {
        doc.text(selectedInvoice.customers.name, 14, 40);
      }
      
      // Items table with simplified columns
      const tableColumn = ['Item', 'Qty', 'Price', 'Amount'];
      let tableRows = [];
      
      if (selectedInvoice.invoice_items && Array.isArray(selectedInvoice.invoice_items)) {
        tableRows = selectedInvoice.invoice_items.map(item => {
          const name = item?.products?.name || 'Unknown Product';
          const qty = item?.quantity || 0;
          const price = item?.unit_price || 0;
          const amount = ((qty * price) * (1 - ((item?.discount_percent || 0) / 100)));
          
          return [
            name.substring(0, 30),
            qty.toString(),
            `$${price.toFixed(2)}`,
            `$${amount.toFixed(2)}`
          ];
        });
      }
      
      // Add summary row
      tableRows.push(['', '', 'Total:', `$${(selectedInvoice.total_amount || 0).toFixed(2)}`]);
      
      // Add table
      doc.autoTable({
        startY: 45,
        head: [tableColumn],
        body: tableRows.slice(0, -1),
        foot: [tableRows[tableRows.length - 1]],
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Generate PDF and open in new window for printing
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Use printJS to print the PDF
      printJS({
        printable: pdfUrl,
        type: 'pdf',
        showModal: true
      });
      
      // Clean up URL object after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
      
    } catch (error) {
      console.error("Simple PDF print error:", error);
      throw error;
    }
  };

  const handleDownloadPDF = () => {
    try {
      if (!selectedInvoice || !invoicePrintRef.current) {
        alert("Invoice information is not available");
        return;
      }
      
      // Show loading indicator
      setLoading(true);
      
      // Get the invoice template element
      const invoiceElement = invoicePrintRef.current;
      
      // Use html2canvas to capture the invoice template as an image
      html2canvas(invoiceElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: "#ffffff"
      }).then(canvas => {
        // Create new jsPDF instance
        const pdf = new jsPDF('portrait', 'mm', 'a4');
        
        // Get canvas dimensions
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add image to first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Add page numbers
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.text(
            `Invoice #${selectedInvoice.invoice_number || 'N/A'} - Page ${i} of ${totalPages}`, 
            pdf.internal.pageSize.getWidth() / 2, 
            pdf.internal.pageSize.getHeight() - 5, 
            { align: 'center' }
          );
        }
        
        // Save the PDF
        pdf.save(`Invoice_${selectedInvoice.invoice_number || 'unknown'}.pdf`);
        console.log("PDF download completed successfully");
        setLoading(false);
      }).catch(error => {
        console.error("HTML to Canvas error:", error);
        setLoading(false);
        alert("There was an error generating the PDF. Falling back to simple PDF.");
        generateSimplePDF();
      });
    } catch (error) {
      console.error("Error in PDF generation:", error);
      setLoading(false);
      alert("There was an error generating the PDF. Falling back to simple PDF.");
      generateSimplePDF();
    }
  };
  
  // Fallback simple PDF generation without html2canvas
  const generateSimplePDF = () => {
    try {
      if (!selectedInvoice) return;
      
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Simple header
      doc.setFontSize(16);
      doc.text("Electronics Retail Shop", 14, 15);
      doc.setFontSize(10);
      doc.text("Invoice #" + (selectedInvoice.invoice_number || 'N/A'), 14, 25);
      
      // Customer info
      doc.text("Bill To:", 14, 35);
      if (selectedInvoice.customers && selectedInvoice.customers.name) {
        doc.text(selectedInvoice.customers.name, 14, 40);
      }
      
      // Items table
      const tableColumn = ['Item', 'Qty', 'Price', 'Amount'];
      let tableRows = [];
      
      if (selectedInvoice.invoice_items && Array.isArray(selectedInvoice.invoice_items)) {
        tableRows = selectedInvoice.invoice_items.map(item => {
          const name = item?.products?.name || 'Unknown Product';
          const qty = item?.quantity || 0;
          const price = item?.unit_price || 0;
          const amount = ((qty * price) * (1 - ((item?.discount_percent || 0) / 100)));
          
          return [
            name.substring(0, 30),
            qty.toString(),
            `$${price.toFixed(2)}`,
            `$${amount.toFixed(2)}`
          ];
        });
      }
      
      // Add summary row
      tableRows.push(['', '', 'Total:', `$${(selectedInvoice.total_amount || 0).toFixed(2)}`]);
      
      // Add table
      doc.autoTable({
        startY: 45,
        head: [tableColumn],
        body: tableRows.slice(0, -1),
        foot: [tableRows[tableRows.length - 1]],
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] }
      });
      
      // Save PDF
      doc.save(`Invoice_${selectedInvoice.invoice_number || 'unknown'}.pdf`);
    } catch (error) {
      console.error("Simple PDF generation error:", error);
      alert("Could not generate PDF. Please try again later.");
    }
  };

  // Note: Using the filteredInvoices variable defined earlier in the component
  // This was a duplicate filter definition that's now been removed

  const resetFilters = () => {
    setSearchTerm('');
    setPaymentStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
  };

  if (loading && invoices.length === 0) {
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

  // Batch print modal
  const BatchPrintModal = ({ onClose }) => (
    <Modal handleClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Batch Print/Download Invoices</h2>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            {selectedInvoices.length} invoice(s) selected
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Filter
            </label>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => {setBatchDateFilter('thisWeek'); applyBatchDateFilter();}}
                className={`px-3 py-1 text-sm rounded ${batchDateFilter === 'thisWeek' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                This Week
              </button>
              <button 
                onClick={() => {setBatchDateFilter('thisMonth'); applyBatchDateFilter();}}
                className={`px-3 py-1 text-sm rounded ${batchDateFilter === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                This Month
              </button>
              <button 
                onClick={() => {setBatchDateFilter('thisYear'); applyBatchDateFilter();}}
                className={`px-3 py-1 text-sm rounded ${batchDateFilter === 'thisYear' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                This Year
              </button>
              <button 
                onClick={() => {setBatchDateFilter('all'); setSelectedInvoices([]);}}
                className={`px-3 py-1 text-sm rounded ${batchDateFilter === 'all' && selectedInvoices.length === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Clear Selection
              </button>
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2">
                    <input 
                      type="checkbox" 
                      checked={selectedInvoices.length > 0 && selectedInvoices.length === filteredInvoices.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{invoice.invoice_number}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{invoice.customers?.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(invoice.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            Cancel
          </button>
          <button 
            onClick={handleBatchPrint}
            disabled={selectedInvoices.length === 0}
            className={`px-4 py-2 rounded flex items-center ${selectedInvoices.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Batch
          </button>
          <button 
            onClick={handleBatchPdfDownload}
            disabled={selectedInvoices.length === 0}
            className={`px-4 py-2 rounded flex items-center ${selectedInvoices.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <motion.div
      className="space-y-6 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Show modals */}
      <AnimatePresence>
        {showBatchPrintModal && <BatchPrintModal onClose={() => setShowBatchPrintModal(false)} />}
      </AnimatePresence>
      
      {/* Header and Create Button */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mr-4">Billing Management</h1>
            <div className="hidden md:block">
              <span className="text-sm text-gray-500">
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center transition-colors shadow-sm"
              onClick={() => setShowNewInvoiceModal(true)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Invoice
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center transition-colors shadow-sm"
              onClick={() => window.location.href = '/accounts/overview'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View Accounts
            </motion.button>
          </div>
        </div>
      </div>

      {/* Accounts Summary Cards */}
      {accountsSummary && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Invoiced</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {formatCurrency(accountsSummary.totalInvoiced)}
                  </p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {formatCurrency(accountsSummary.totalPaid)}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">
                    {formatCurrency(accountsSummary.totalPending)}
                  </p>
                </div>
                <div className="text-3xl">⏳</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center transition-colors shadow-sm"
              onClick={() => setShowBatchPrintModal(true)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Batch Print/Download
            </motion.button>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search invoices or customers..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Invoices</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              id="status-filter"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              id="start-date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              id="end-date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
        
        {/* Reset Filters Button */}
        {(searchTerm || paymentStatusFilter || dateRange.startDate || dateRange.endDate) && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setPaymentStatusFilter('');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Invoices Table */}
      <AnimatePresence>
        {filteredInvoices.length === 0 ? (
          <motion.p
            className="text-slate-500 text-center py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No invoices found.
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
                    { label: 'Invoice #', field: 'invoice_number' },
                    { label: 'Date', field: 'invoice_date' },
                    { label: 'Customer', field: null },
                    { label: 'Amount', field: 'total_amount' },
                    { label: 'Status', field: 'payment_status' },
                    { label: 'Payment Method', field: 'payment_method' },
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
                {filteredInvoices.map((invoice) => (
                  <motion.tr
                    key={invoice.id}
                    variants={rowVariants}
                    whileHover={{ scale: 1.01, boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
                    className="transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer" 
                           onClick={() => {
                             setSelectedInvoice(invoice);
                             setShowInvoiceDetailModal(true);
                           }}>
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{invoice.customers?.name}</div>
                      <div className="text-xs text-slate-500">{invoice.customers?.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {formatCurrency(invoice.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                        ${invoice.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${invoice.payment_status === 'partial' ? 'bg-blue-100 text-blue-800' : ''}
                        ${invoice.payment_status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                      </span>
                      {invoice.payment_status === 'partial' && invoice.amount_paid && (
                        <div className="text-xs text-slate-500 mt-1">
                          Paid: ₹{parseFloat(invoice.amount_paid).toFixed(2)} of ₹{parseFloat(invoice.total_amount).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">
                        {invoice.payment_method || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowInvoiceDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                          title="View Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        
                        {/* Payment Button - Show for pending and partial invoices */}
                        {(invoice.payment_status === 'pending' || invoice.payment_status === 'partial') && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowPaymentModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                            title={invoice.payment_status === 'partial' ? "Record Additional Payment" : "Record Payment"}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            {invoice.payment_status === 'partial' && invoice.amount_paid && (
                              <span className="ml-1 text-xs">
                                (₹{parseFloat(invoice.amount_paid).toFixed(2)})
                              </span>
                            )}
                          </button>
                        )}
                        
                        {/* Account Statement Button */}
                        <button
                          onClick={() => handleViewAccountStatement(invoice.customers)}
                          className="text-purple-600 hover:text-purple-900 px-2 py-1 rounded hover:bg-purple-50"
                          title="View Account Statement"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => startEditInvoice(invoice)}
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50"
                          title="Edit Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                          title="Delete Invoice"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Invoice Modal */}
      <AnimatePresence>
        {showNewInvoiceModal && (
          <Modal handleClose={() => setShowNewInvoiceModal(false)}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create New Invoice</h2>
              
              {/* Customer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={invoiceForm.customer_id}
                    onChange={(e) => setInvoiceForm({...invoiceForm, customer_id: e.target.value})}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerToEdit(null);
                      setShowCustomerModal(true);
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                  >
                    New Customer
                  </button>
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>
                
                {invoiceForm.items.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg">
                    No items added. Click "Add Item" to add products to this invoice.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoiceForm.items.map((item, index) => (
                      <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Item #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoiceItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Product */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.product_id}
                              onChange={(e) => handleInvoiceItemChange(index, 'product_id', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            >
                              <option value="">Select Product</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Variant (if product has variants) */}
                          {item.product_id && products.find(p => p.id === item.product_id)?.product_variants?.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Variant
                              </label>
                              <select
                                value={item.variant_id || ''}
                                onChange={(e) => handleInvoiceItemChange(index, 'variant_id', e.target.value || null)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="">Base Model</option>
                                {products.find(p => p.id === item.product_id)?.product_variants.map(variant => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.attribute_name}: {variant.value} 
                                    {variant.price_adjustment > 0 && ` (+₹${variant.price_adjustment.toFixed(2)})`}
                                    {variant.price_adjustment < 0 && ` (-₹${Math.abs(variant.price_adjustment).toFixed(2)})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInvoiceItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            />
                          </div>
                          
                          {/* Unit Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleInvoiceItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            />
                          </div>
                          
                          {/* Discount Percent */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              value={item.discount_percent}
                              onChange={(e) => handleInvoiceItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          
                          {/* Serial Number */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Serial Number
                            </label>
                            <input
                              type="text"
                              value={item.serial_number}
                              onChange={(e) => handleInvoiceItemChange(index, 'serial_number', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              placeholder="Device serial number"
                            />
                          </div>
                          
                          {/* Warranty Months */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Warranty (Months)
                            </label>
                            <input
                              type="number"
                              value={item.warranty_months}
                              onChange={(e) => handleInvoiceItemChange(index, 'warranty_months', parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          
                          {/* Item Total (calculated) */}
                          <div className="md:col-span-2">
                            <div className="flex justify-end">
                              <div className="text-right">
                                <span className="text-xs text-slate-500">Subtotal:</span>
                                <div className="text-sm font-medium">
                                  ₹{((item.quantity * item.unit_price) * (1 - (item.discount_percent / 100))).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Invoice Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={invoiceForm.payment_status}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_status: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.payment_method}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_method: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  />
                </div>
                
                {/* Partial Payment Amount - Only show when payment status is partial */}
                {invoiceForm.payment_status === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">₹</span>
                      <input
                        type="number"
                        value={invoiceForm.amount_paid}
                        onChange={(e) => setInvoiceForm({...invoiceForm, amount_paid: parseFloat(e.target.value) || 0})}
                        min="0"
                        max={invoiceForm.total_amount}
                        step="0.01"
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Remaining: ₹{Math.max(0, invoiceForm.total_amount - invoiceForm.amount_paid).toFixed(2)}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.discount_amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, discount_amount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Amount
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.tax_amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, tax_amount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="Any additional notes for this invoice"
                  />
                </div>
              </div>
              
              {/* Invoice Summary */}
              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>₹{(invoiceForm.total_amount + invoiceForm.discount_amount - invoiceForm.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Discount:</span>
                  <span>₹{invoiceForm.discount_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Tax:</span>
                  <span>₹{invoiceForm.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium text-base mt-2 pt-2 border-t border-slate-200">
                  <span>Total:</span>
                  <span>₹{invoiceForm.total_amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewInvoiceModal(false)}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={createInvoice}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Invoice Modal */}
      <AnimatePresence>
        {showEditInvoiceModal && (
          <Modal handleClose={() => {
            setShowEditInvoiceModal(false);
            setEditingInvoice(null);
            setInvoiceForm({
              customer_id: '',
              payment_status: 'pending',
              payment_method: '',
              notes: '',
              items: [],
              discount_amount: 0,
              tax_amount: 0,
              total_amount: 0,
              warranty_provided: false
            });
          }}>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Edit Invoice #{editingInvoice?.invoice_number}</h2>
              
              {/* Customer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={invoiceForm.customer_id}
                    onChange={(e) => setInvoiceForm({...invoiceForm, customer_id: e.target.value})}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerToEdit(null);
                      setShowCustomerModal(true);
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                  >
                    New Customer
                  </button>
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-700">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={handleAddInvoiceItem}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>
                
                {invoiceForm.items.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 bg-slate-50 rounded-lg">
                    No items added. Click "Add Item" to add products to this invoice.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoiceForm.items.map((item, index) => (
                      <div key={item.id || index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Item #{index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveInvoiceItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Product */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Product <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.product_id}
                              onChange={(e) => handleInvoiceItemChange(index, 'product_id', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            >
                              <option value="">Select Product</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Variant (if product has variants) */}
                          {item.product_id && products.find(p => p.id === item.product_id)?.product_variants?.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Variant
                              </label>
                              <select
                                value={item.variant_id || ''}
                                onChange={(e) => handleInvoiceItemChange(index, 'variant_id', e.target.value || null)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              >
                                <option value="">Base Model</option>
                                {products.find(p => p.id === item.product_id)?.product_variants.map(variant => (
                                  <option key={variant.id} value={variant.id}>
                                    {variant.attribute_name}: {variant.value} 
                                    {variant.price_adjustment > 0 && ` (+₹${variant.price_adjustment.toFixed(2)})`}
                                    {variant.price_adjustment < 0 && ` (-₹${Math.abs(variant.price_adjustment).toFixed(2)})`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          
                          {/* Quantity */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleInvoiceItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              min="1"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            />
                          </div>
                          
                          {/* Unit Price */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Unit Price <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => handleInvoiceItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              required
                            />
                          </div>
                          
                          {/* Discount Percent */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Discount (%)
                            </label>
                            <input
                              type="number"
                              value={item.discount_percent}
                              onChange={(e) => handleInvoiceItemChange(index, 'discount_percent', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.1"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          
                          {/* Serial Number */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Serial Number
                            </label>
                            <input
                              type="text"
                              value={item.serial_number}
                              onChange={(e) => handleInvoiceItemChange(index, 'serial_number', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                              placeholder="Device serial number"
                            />
                          </div>
                          
                          {/* Warranty Months */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Warranty (Months)
                            </label>
                            <input
                              type="number"
                              value={item.warranty_months}
                              onChange={(e) => handleInvoiceItemChange(index, 'warranty_months', parseInt(e.target.value) || 0)}
                              min="0"
                              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                          </div>
                          
                          {/* Item Total (calculated) */}
                          <div className="md:col-span-2">
                            <div className="flex justify-end">
                              <div className="text-right">
                                <span className="text-xs text-slate-500">Subtotal:</span>
                                <div className="text-sm font-medium">
                                  ₹{((item.quantity * item.unit_price) * (1 - (item.discount_percent / 100))).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Invoice Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={invoiceForm.payment_status}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_status: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.payment_method}
                    onChange={(e) => setInvoiceForm({...invoiceForm, payment_method: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="e.g., Cash, Credit Card, Bank Transfer"
                  />
                </div>
                
                {/* Partial Payment Amount - Only show when payment status is partial */}
                {invoiceForm.payment_status === 'partial' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount Paid <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-500">₹</span>
                      <input
                        type="number"
                        value={invoiceForm.amount_paid}
                        onChange={(e) => setInvoiceForm({...invoiceForm, amount_paid: parseFloat(e.target.value) || 0})}
                        min="0"
                        max={invoiceForm.total_amount}
                        step="0.01"
                        className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Remaining: ₹{Math.max(0, invoiceForm.total_amount - invoiceForm.amount_paid).toFixed(2)}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Amount
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.discount_amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, discount_amount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Amount
                  </label>
                  <input
                    type="number"
                    value={invoiceForm.tax_amount}
                    onChange={(e) => setInvoiceForm({...invoiceForm, tax_amount: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                    placeholder="Any additional notes for this invoice"
                  />
                </div>
              </div>
              
              {/* Invoice Summary */}
              <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>₹{(invoiceForm.total_amount + invoiceForm.discount_amount - invoiceForm.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Discount:</span>
                  <span>₹{invoiceForm.discount_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Tax:</span>
                  <span>₹{invoiceForm.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{invoiceForm.total_amount.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Warranty Checkbox */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={invoiceForm.warranty_provided}
                    onChange={(e) => setInvoiceForm({...invoiceForm, warranty_provided: e.target.checked})}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Warranty provided for this invoice</span>
                </label>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditInvoiceModal(false);
                    setEditingInvoice(null);
                    setInvoiceForm({
                      customer_id: '',
                      payment_status: 'pending',
                      payment_method: '',
                      notes: '',
                      items: [],
                      discount_amount: 0,
                      tax_amount: 0,
                      total_amount: 0,
                      amount_paid: 0,
                      warranty_provided: false
                    });
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={updateInvoice}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Invoice'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <Modal handleClose={() => setShowCustomerModal(false)}>
            <div className="p-6">
              <CustomerForm 
                customer={customerToEdit}
                onSubmit={handleCustomerSubmit}
                onCancel={() => setShowCustomerModal(false)}
              />
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {showInvoiceDetailModal && selectedInvoice && (
          <Modal handleClose={() => setShowInvoiceDetailModal(false)}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">Invoice #{selectedInvoice.invoice_number}</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center"
                    title="React-to-print method"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print
                  </button>
                  <button
                    onClick={handleAlternativePrint}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm flex items-center"
                    title="PDF-based printing method"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v-4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                    </svg>
                    Print Alt
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 text-sm flex items-center"
                    title="Native browser print dialog"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
                    </svg>
                    Browser Print
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center"
                    title="Download as PDF file"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>

                </div>
              </div>
              
              {/* Printable Invoice Template */}
              <div ref={invoicePrintRef} className="bg-white print:shadow-none print:p-0">
                <InvoiceTemplate 
                  invoice={selectedInvoice} 
                  companyDetails={templateData}
                />
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowInvoiceDetailModal(false)}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      
      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedInvoice && (
          <PaymentModal
            invoice={selectedInvoice}
            onClose={() => setShowPaymentModal(false)}
            onPaymentComplete={handlePaymentComplete}
          />
        )}
      </AnimatePresence>
      
      {/* Customer Account Statement Modal */}
      <AnimatePresence>
        {showAccountStatement && selectedCustomer && (
          <CustomerAccountStatement
            customer={selectedCustomer}
            onClose={() => setShowAccountStatement(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Billing;