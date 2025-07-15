import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../contexts/CurrencyContext';

const AccountsSettings = () => {
  const { currentCurrency, changeCurrency, getCurrencyInfo } = useCurrency();
  const [settings, setSettings] = useState({
    defaultCurrency: currentCurrency,
    fiscalYearStart: '01-01',
    taxRate: 10,
    autoBackup: true,
    emailReports: true,
    lowCashAlert: true,
    lowCashThreshold: 1000,
    defaultPaymentTerms: 30,
    invoicePrefix: 'INV-',
    receiptPrefix: 'REC-',
    timeZone: 'America/New_York'
  });

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ];

  const timeZones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Update currency context if currency is changed
    if (key === 'defaultCurrency') {
      changeCurrency(value);
    }
  };

  const handleSaveSettings = () => {
    // Save settings to backend/localStorage
    console.log('Saving settings:', settings);
    // Show success message
    alert('Settings saved successfully!');
  };

  const SettingCard = ({ title, description, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={onChange}
        />
        <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
        <div
          className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${
            checked ? 'transform translate-x-6' : ''
          }`}
        ></div>
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Accounts Settings
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure your accounting preferences and system settings
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Save Settings
        </button>
      </motion.div>

      {/* General Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <SettingCard
          title="General Settings"
          description="Basic accounting system configuration"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Currency
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={(e) => handleSettingChange('defaultCurrency', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Zone
              </label>
              <select
                value={settings.timeZone}
                onChange={(e) => handleSettingChange('timeZone', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                {timeZones.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fiscal Year Start (MM-DD)
              </label>
              <input
                type="text"
                value={settings.fiscalYearStart}
                onChange={(e) => handleSettingChange('fiscalYearStart', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="01-01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.taxRate}
                onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="0"
                max="100"
              />
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Invoice & Receipt Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <SettingCard
          title="Invoice & Receipt Settings"
          description="Configure numbering and payment terms"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => handleSettingChange('invoicePrefix', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="INV-"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Receipt Prefix
              </label>
              <input
                type="text"
                value={settings.receiptPrefix}
                onChange={(e) => handleSettingChange('receiptPrefix', e.target.value)}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="REC-"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Payment Terms (Days)
              </label>
              <input
                type="number"
                value={settings.defaultPaymentTerms}
                onChange={(e) => handleSettingChange('defaultPaymentTerms', parseInt(e.target.value))}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Alert Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SettingCard
          title="Alert Settings"
          description="Configure notifications and alerts"
        >
          <div className="space-y-4">
            <Toggle
              label="Low Cash Alert"
              checked={settings.lowCashAlert}
              onChange={(e) => handleSettingChange('lowCashAlert', e.target.checked)}
            />
            
            {settings.lowCashAlert && (
              <div className="ml-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Cash Threshold
                </label>
                <input
                  type="number"
                  value={settings.lowCashThreshold}
                  onChange={(e) => handleSettingChange('lowCashThreshold', parseFloat(e.target.value))}
                  className="w-full max-w-xs rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
            
            <Toggle
              label="Email Reports"
              checked={settings.emailReports}
              onChange={(e) => handleSettingChange('emailReports', e.target.checked)}
            />
            
            <Toggle
              label="Auto Backup"
              checked={settings.autoBackup}
              onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
            />
          </div>
        </SettingCard>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <SettingCard
          title="Data Management"
          description="Backup and export your accounting data"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
              <div className="space-y-2">
                <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Export to CSV
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Export to PDF
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backup</h4>
              <div className="space-y-2">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Create Backup
                </button>
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Restore from Backup
                </button>
              </div>
            </div>
          </div>
        </SettingCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <SettingCard
          title="Danger Zone"
          description="Irreversible actions - use with caution"
        >
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">
                Reset All Data
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                This will permanently delete all your accounting data. This action cannot be undone.
              </p>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                Reset All Data
              </button>
            </div>
          </div>
        </SettingCard>
      </motion.div>
    </div>
  );
};

export default AccountsSettings;
