import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useTemplate } from '../contexts/TemplateContext';
import { useCurrency, CURRENCIES } from '../contexts/CurrencyContext';
import TemplateEditor from '../components/TemplateEditor';

const SettingSection = ({ title, description, children }) => (
  <div className="card bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 mb-6">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
    {children}
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    <div className="relative">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
      <div
        className={`absolute left-1 top-1 bg-white dark:bg-gray-200 w-6 h-6 rounded-full transition-transform ${
          checked ? 'transform translate-x-6' : ''
        }`}
      ></div>
    </div>
  </label>
);

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { templateData, updateTemplateData } = useTemplate();
  const { currentCurrency, changeCurrency, formatCurrency, getCurrencyInfo } = useCurrency();
  
  const [notifications, setNotifications] = useState({
    email: true,
    lowStock: true,
    sales: false,
    updates: true
  });

  const [preferences, setPreferences] = useState({
    darkMode: darkMode, // Initialize with the value from ThemeContext
    compactView: true,
    autoSave: true
  });
  
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);

  // Sync darkMode preference with ThemeContext when component mounts
  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      darkMode
    }));
  }, [darkMode]);

  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handlePreferenceChange = (key) => {
    if (key === 'darkMode') {
      // Toggle the dark mode in the ThemeContext
      toggleDarkMode();
    }
    
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <button className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          Save Changes
        </button>
      </motion.div>

      <TemplateEditor
        isOpen={showTemplateEditor}
        onClose={() => setShowTemplateEditor(false)}
        initialTemplateData={templateData}
        onSave={(newTemplateData) => {
          updateTemplateData(newTemplateData);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingSection
          title="Business Information"
          description="Manage your business information for invoices and documents"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-md font-medium text-slate-800 dark:text-white">{templateData.companyName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{templateData.address}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {templateData.phone} | {templateData.email}
                </p>
              </div>
              <button 
                onClick={() => setShowTemplateEditor(true)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Edit Template
              </button>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Preview:</h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800">
                <div className="flex justify-between text-xs">
                  <div>
                    <div className="font-bold text-blue-600">{templateData.companyName}</div>
                    <div>{templateData.address}</div>
                    <div>Tax ID: {templateData.taxId}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">INVOICE</div>
                    <div>Date: {new Date().toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-center text-gray-500">
                  {templateData.footerText}
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        <SettingSection
          title="Currency & Regional Settings"
          description="Configure currency format and regional preferences"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Currency
              </label>
              <select 
                className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-gray-700 dark:text-white p-3"
                value={currentCurrency}
                onChange={(e) => changeCurrency(e.target.value)}
              >
                {Object.entries(CURRENCIES).map(([code, currency]) => (
                  <option key={code} value={code}>
                    {currency.symbol} {currency.name} ({code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will change how all monetary values are displayed throughout the application
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-slate-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preview:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Sample Price:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(1234.56)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Large Amount:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(123456.78)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Small Amount:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(9.99)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <strong>Selected:</strong> {getCurrencyInfo().name} ({getCurrencyInfo().code})
                  <br />
                  <strong>Symbol:</strong> {getCurrencyInfo().symbol}
                  <br />
                  <strong>Decimal Places:</strong> {getCurrencyInfo().decimal}
                </div>
              </div>
            </div>
          </div>
        </SettingSection>
        
        <SettingSection
          title="Notifications"
          description="Configure how you want to receive notifications"
        >
          <div className="space-y-4">
            <Toggle
              label="Email Notifications"
              checked={notifications.email}
              onChange={() => handleNotificationChange('email')}
            />
            <Toggle
              label="Low Stock Alerts"
              checked={notifications.lowStock}
              onChange={() => handleNotificationChange('lowStock')}
            />
            <Toggle
              label="Sales Reports"
              checked={notifications.sales}
              onChange={() => handleNotificationChange('sales')}
            />
            <Toggle
              label="System Updates"
              checked={notifications.updates}
              onChange={() => handleNotificationChange('updates')}
            />
          </div>
        </SettingSection>

        <SettingSection
          title="Preferences"
          description="Customize your application experience"
        >
          <div className="space-y-4">
            <Toggle
              label="Dark Mode"
              checked={preferences.darkMode}
              onChange={() => handlePreferenceChange('darkMode')}
            />
            <Toggle
              label="Compact View"
              checked={preferences.compactView}
              onChange={() => handlePreferenceChange('compactView')}
            />
            <Toggle
              label="Auto Save"
              checked={preferences.autoSave}
              onChange={() => handlePreferenceChange('autoSave')}
            />
          </div>
        </SettingSection>

        <SettingSection
          title="Account Settings"
          description="Manage your account preferences"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Language
              </label>
              <select className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-gray-700 dark:text-white">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time Zone
              </label>
              <select className="w-full rounded-lg border-slate-200 dark:border-slate-600 dark:bg-gray-700 dark:text-white">
                <option value="utc">UTC</option>
                <option value="est">Eastern Time</option>
                <option value="pst">Pacific Time</option>
                <option value="gmt">GMT</option>
              </select>
            </div>
          </div>
        </SettingSection>

        <SettingSection
          title="Security"
          description="Manage your security settings"
        >
          <div className="space-y-4">
            <button className="w-full btn-secondary bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white py-2 rounded-lg transition-colors">
              Change Password
            </button>
            <button className="w-full btn-secondary bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white py-2 rounded-lg transition-colors">
              Enable Two-Factor Authentication
            </button>
            <button className="w-full btn-secondary bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white py-2 rounded-lg transition-colors">
              View Login History
            </button>
          </div>
        </SettingSection>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Danger Zone</h2>
        <div className="space-y-4">
          <button className="w-full btn-danger bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
            Delete Account
          </button>
          <button className="w-full btn-danger bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors">
            Clear All Data
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings; 