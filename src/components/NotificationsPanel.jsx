import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadNotifications, markNotificationsAsRead, NOTIFICATION_TYPES } from '../utils/notificationUtils';

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await getUnreadNotifications();
      
      if (error) throw error;
      
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await markNotificationsAsRead(notificationId);
      
      if (error) throw error;
      
      // Update local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const notificationIds = notifications.map(n => n.id);
      
      if (notificationIds.length === 0) return;
      
      const { error } = await markNotificationsAsRead(notificationIds);
      
      if (error) throw error;
      
      setNotifications([]);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.LOW_STOCK:
        return (
          <div className="flex-shrink-0">
            <span className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        );
      case NOTIFICATION_TYPES.OUT_OF_STOCK:
        return (
          <div className="flex-shrink-0">
            <span className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        );
      case NOTIFICATION_TYPES.EXPIRING_SOON:
        return (
          <div className="flex-shrink-0">
            <span className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-orange-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        );
      case NOTIFICATION_TYPES.ORDER_RECEIVED:
        return (
          <div className="flex-shrink-0">
            <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0">
            <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none focus:text-gray-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium text-center">
            {notifications.length}
          </span>
        )}
      </button>
      
      {/* Notifications Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No new notifications
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {notifications.map(notification => (
                    <motion.li 
                      key={notification.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start">
                        {getNotificationIcon(notification.type)}
                        <div className="ml-3 flex-1">
                          <div className="text-sm text-gray-800">{notification.message}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="ml-2 text-sm text-gray-400 hover:text-gray-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPanel;
