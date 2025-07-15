import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

// Comprehensive currency configurations
export const CURRENCIES = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    position: 'before', // before or after the amount
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    position: 'after',
    decimal: 2,
    thousands: '.',
    decimalSeparator: ',',
    format: (amount) => `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    position: 'before',
    decimal: 0,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `¥${amount.toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `C$${amount.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `A$${amount.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  BRL: {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    position: 'before',
    decimal: 2,
    thousands: '.',
    decimalSeparator: ',',
    format: (amount) => `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `S$${amount.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `د.إ ${amount.toLocaleString('ar-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `ر.س ${amount.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  ZAR: {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    position: 'before',
    decimal: 2,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  },
  KRW: {
    code: 'KRW',
    name: 'South Korean Won',
    symbol: '₩',
    position: 'before',
    decimal: 0,
    thousands: ',',
    decimalSeparator: '.',
    format: (amount) => `₩${amount.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }
};

export const CurrencyProvider = ({ children }) => {
  const [currentCurrency, setCurrentCurrency] = useState(() => {
    // Load from localStorage or default to USD
    const saved = localStorage.getItem('selectedCurrency');
    return saved || 'USD';
  });

  // Save to localStorage whenever currency changes
  useEffect(() => {
    localStorage.setItem('selectedCurrency', currentCurrency);
  }, [currentCurrency]);

  const formatCurrency = (amount, currencyCode = null) => {
    const currency = CURRENCIES[currencyCode || currentCurrency];
    if (!currency) {
      console.warn(`Currency ${currencyCode || currentCurrency} not found, using USD`);
      return CURRENCIES.USD.format(amount);
    }
    
    // Handle null, undefined, or invalid amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return currency.format(0);
    }
    
    return currency.format(Number(amount));
  };

  const getCurrencySymbol = (currencyCode = null) => {
    const currency = CURRENCIES[currencyCode || currentCurrency];
    return currency ? currency.symbol : CURRENCIES.USD.symbol;
  };

  const getCurrencyInfo = (currencyCode = null) => {
    const currency = CURRENCIES[currencyCode || currentCurrency];
    return currency || CURRENCIES.USD;
  };

  const changeCurrency = (newCurrencyCode) => {
    if (CURRENCIES[newCurrencyCode]) {
      setCurrentCurrency(newCurrencyCode);
    } else {
      console.warn(`Invalid currency code: ${newCurrencyCode}`);
    }
  };

  // Helper function to convert amounts (for future use with exchange rates)
  const convertAmount = (amount, fromCurrency, toCurrency) => {
    // For now, return the same amount since we don't have exchange rates
    // In the future, you can integrate with an exchange rate API
    return amount;
  };

  const value = {
    currentCurrency,
    currencies: CURRENCIES,
    formatCurrency,
    getCurrencySymbol,
    getCurrencyInfo,
    changeCurrency,
    convertAmount
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;