import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// Modal background overlay
const Backdrop = ({ children, onClick }) => (
  <motion.div
    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4"
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
    <Backdrop onClick={handleClose}>
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {children}
      </motion.div>
    </Backdrop>
  );
};

const CategoryManager = ({ isOpen, onClose, onCategoriesChange }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Instead of trying to create tables, we'll use a client-side approach
  // using localStorage to store categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load categories from localStorage
      const savedCategories = localStorage.getItem('productCategories');
      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } else {
        // Initialize with default categories if none exist
        const defaultCategories = [
          { id: 'electronics', name: 'Electronics' },
          { id: 'clothing', name: 'Clothing' },
          { id: 'food', name: 'Food' },
          { id: 'furniture', name: 'Furniture' },
          { id: 'other', name: 'Other' }
        ];
        setCategories(defaultCategories);
        localStorage.setItem('productCategories', JSON.stringify(defaultCategories));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Generate a unique ID for the new category
      const newCategoryObj = { 
        id: Date.now().toString(), // Simple unique ID based on timestamp
        name: newCategory.trim() 
      };
      
      // Add to state
      const updatedCategories = [...categories, newCategoryObj];
      setCategories(updatedCategories);
      
      // Save to localStorage
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      
      setNewCategory('');
      if (onCategoriesChange) onCategoriesChange();
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Failed to add category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editName.trim() || !editingCategory) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Update category in state
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id ? { ...cat, name: editName.trim() } : cat
      );
      
      setCategories(updatedCategories);
      
      // Save to localStorage
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      
      setEditingCategory(null);
      setEditName('');
      if (onCategoriesChange) onCategoriesChange();
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Failed to update category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Remove category from state
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      setCategories(updatedCategories);
      
      // Save to localStorage
      localStorage.setItem('productCategories', JSON.stringify(updatedCategories));
      
      if (onCategoriesChange) onCategoriesChange();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  if (!isOpen) return null;

  return (
    <Modal handleClose={onClose}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Manage Categories</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-500"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add new category */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddCategory}
              disabled={loading || !newCategory.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Category list */}
        <div className="max-h-80 overflow-y-auto">
          {loading && categories.length === 0 ? (
            <div className="text-center py-4 text-slate-500">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4 text-slate-500">No categories yet. Add your first one above.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {categories.map(category => (
                <li key={category.id} className="py-3">
                  {editingCategory && editingCategory.id === category.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleUpdateCategory}
                        disabled={loading || !editName.trim()}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">{category.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(category)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit category"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete category"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManager;