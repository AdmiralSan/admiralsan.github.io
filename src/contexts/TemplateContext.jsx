import React, { createContext, useState, useContext, useEffect } from 'react';

// Default template data
const defaultTemplateData = {
  companyName: 'Electronics Retail Shop',
  address: '123 Electronics Street, Gadget City',
  phone: '123-456-7890',
  email: 'contact@electronicsshop.com',
  website: 'www.electronicsshop.com',
  taxId: 'TAX123456789',
  footerText: 'Thank you for your business!',
  footerContact: 'For any questions regarding this invoice, please contact us at'
};

// Create context
const TemplateContext = createContext();

// Template provider component
export const TemplateProvider = ({ children }) => {
  const [templateData, setTemplateData] = useState(defaultTemplateData);

  // Load template data from localStorage on initialization
  useEffect(() => {
    try {
      const savedTemplateData = localStorage.getItem('invoiceTemplateData');
      if (savedTemplateData) {
        setTemplateData(JSON.parse(savedTemplateData));
      }
    } catch (e) {
      console.error("Could not load template data from localStorage:", e);
    }
  }, []);

  // Save template data to localStorage whenever it changes
  const updateTemplateData = (newTemplateData) => {
    setTemplateData(newTemplateData);
    try {
      localStorage.setItem('invoiceTemplateData', JSON.stringify(newTemplateData));
    } catch (e) {
      console.error("Could not save template to localStorage:", e);
    }
  };

  return (
    <TemplateContext.Provider value={{ templateData, updateTemplateData }}>
      {children}
    </TemplateContext.Provider>
  );
};

// Custom hook to use the template context
export const useTemplate = () => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
};

export default TemplateContext;