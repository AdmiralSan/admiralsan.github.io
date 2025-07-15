import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const Header = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Static nav links without authentication checks
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Products', href: '/products' },
    { name: 'Inventory', href: '/inventory/overview' },
    { name: 'Service', href: '/service-records' },
    { name: 'Billing', href: '/billing' },
    { name: 'Reports', href: '/reports' },
    { name: 'Settings', href: '/settings' },
    { name: 'Users', href: '/users' }
  ];
  
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-white/80 backdrop-blur shadow-sm w-full sticky top-0 z-30 fade-in"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <NavLink to="/" className="text-2xl font-bold text-blue-600 tracking-tight select-none hover:text-blue-700 transition-colors">
              VsdvBillsoft
            </NavLink>
            
            {/* Mobile menu button */}
            <button 
              className="ml-4 md:hidden text-slate-600 hover:text-blue-600 transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-blue-600'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>
          
          <div className="flex items-center">
            {/* Notification button only */}
            <button className="text-slate-600 hover:text-blue-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-slate-200 py-3"
            >
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.href}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors px-2 py-1 rounded ${
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                      }`
                    }
                    onClick={() => setShowMobileMenu(false)}
                  >
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;