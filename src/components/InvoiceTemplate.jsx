import React from 'react';
// Logo import is optional - uncomment if you have a logo file
// import logo from '../assets/logo.png';

const InvoiceTemplate = ({ invoice, companyDetails = {} }) => {
  if (!invoice) return null;

  // Company details with defaults
  const {
    companyName = 'Electronics Retail Shop',
    address = '123 Electronics Street, Gadget City',
    phone = '123-456-7890',
    email = 'contact@electronicsshop.com',
    website = 'www.electronicsshop.com',
    taxId = 'TAX123456789',
    footerText = 'Thank you for your business!',
    footerContact = 'For any questions regarding this invoice, please contact us at'
  } = companyDetails;

  // Calculate totals
  const subtotal = invoice.invoice_items?.reduce((sum, item) => {
    const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
    const discountAmount = lineTotal * ((item.discount_percent || 0) / 100);
    return sum + (lineTotal - discountAmount);
  }, 0) || 0;

  // Format date
  const formatDate = (dateString) => {
    try {
      return dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  return (
    <div className="invoice-template bg-white p-8 max-w-4xl mx-auto text-gray-800">
      {/* Header */}
      <header className="flex justify-between items-start mb-8 border-b border-gray-200 pb-4">
        <div className="logo-container">
          {/* Text-based logo styling */}
          <div className="mb-2 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl mr-2">
              E
            </div>
            <h1 className="text-2xl font-bold text-blue-600">{companyName}</h1>
          </div>
          <p className="text-sm">{address}</p>
          <p className="text-sm">Phone: {phone}</p>
          <p className="text-sm">Email: {email}</p>
          <p className="text-sm">Web: {website}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-blue-600 mb-1">INVOICE</h2>
          <p className="font-semibold">#{invoice.invoice_number || 'N/A'}</p>
          <p className="text-sm">Date: {formatDate(invoice.invoice_date)}</p>
          <p className="text-sm mt-2 bg-blue-100 text-blue-800 px-2 py-1 rounded inline-block font-medium">
            {invoice.payment_status ? invoice.payment_status.toUpperCase() : 'PENDING'}
          </p>
        </div>
      </header>

      {/* Customer Info */}
      <section className="mb-8 flex justify-between">
        <div className="w-1/2">
          <h3 className="text-gray-600 font-semibold mb-2 border-b border-gray-200 pb-1">Bill To:</h3>
          <p className="font-semibold">{invoice.customers?.name || 'N/A'}</p>
          <p>{invoice.customers?.address || 'N/A'}</p>
          <p>Phone: {invoice.customers?.phone || 'N/A'}</p>
          <p>Email: {invoice.customers?.email || 'N/A'}</p>
        </div>
        <div className="w-1/2">
          <h3 className="text-gray-600 font-semibold mb-2 border-b border-gray-200 pb-1">Payment Information:</h3>
          <p>Method: {invoice.payment_method || 'Not specified'}</p>
          <p>Tax ID: {taxId}</p>
          {invoice.warranty_provided && (
            <p className="text-green-600 font-semibold">Warranty Provided</p>
          )}
        </div>
      </section>

      {/* Items Table */}
      <section className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Serial #</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Warranty</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Discount</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items && invoice.invoice_items.length > 0 ? (
              invoice.invoice_items.map((item, index) => {
                const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
                const discountAmount = lineTotal * ((item.discount_percent || 0) / 100);
                const finalAmount = lineTotal - discountAmount;
                
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">
                      {item.products?.name || 'Unknown Product'}
                      {item.products?.sku && <span className="text-xs text-gray-500 block">SKU: {item.products.sku}</span>}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{item.serial_number || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {item.warranty_months ? `${item.warranty_months} months` : '-'}
                      {item.warranty_end_date && (
                        <span className="text-xs text-gray-500 block">
                          Until: {formatDate(item.warranty_end_date)}
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity || 0}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ₹{(item.unit_price || 0).toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {item.discount_percent ? `${item.discount_percent}%` : '-'}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                      ₹{finalAmount.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="border border-gray-300 px-4 py-2 text-center">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Summary */}
      <section className="flex justify-end mb-8">
        <div className="w-1/3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Subtotal:</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Tax:</span>
            <span>₹{(invoice.tax_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="font-medium">Discount:</span>
            <span>₹{(invoice.discount_amount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-bold">
            <span>Total:</span>
            <span>₹{(invoice.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Notes */}
      {invoice.notes && (
        <section className="mb-8">
          <h3 className="text-gray-600 font-semibold mb-2 border-b border-gray-200 pb-1">Notes:</h3>
          <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
        </section>
      )}

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
        <p>{footerText}</p>
        <p className="mt-1">{footerContact} {email}</p>
        <p className="mt-4">
          <span className="text-xs">Invoice #{invoice.invoice_number || 'N/A'} | Generated on {formatDate(new Date())}</span>
        </p>
      </footer>
    </div>
  );
};

export default InvoiceTemplate;