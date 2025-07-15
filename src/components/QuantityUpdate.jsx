import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { recordStockMovement, determineMovementType } from '../utils/stockMovementUtil';

const QuantityUpdate = ({ productId, currentQuantity, onUpdate, onClose }) => {
  const [quantity, setQuantity] = useState(currentQuantity);
  const [movementType, setMovementType] = useState('adjustment');
  const [note, setNote] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // This is called when the quantity input changes
  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 0;
    setQuantity(newQuantity);
    
    // Auto-determine movement type based on the change
    if (newQuantity > currentQuantity) {
      setMovementType('incoming');
    } else if (newQuantity < currentQuantity) {
      setMovementType('outgoing');
    } else {
      setMovementType('adjustment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity })
        .eq('id', productId);
        
      if (updateError) throw updateError;
      
      // Record stock movement
      await recordStockMovement({
        productId,
        quantity: Math.abs(quantity - currentQuantity),
        movementType,
        referenceNumber,
        notes: note || `${movementType} adjustment from ${currentQuantity} to ${quantity}`
      });
      
      if (onUpdate) {
        onUpdate(quantity);
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">Update Quantity</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="font-medium text-slate-700">Current Quantity:</div>
            <div className="text-lg">{currentQuantity}</div>
          </div>
          
          <div className="relative">
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
              New Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min="0"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
              value={quantity}
              onChange={handleQuantityChange}
              required
            />
          </div>
          
          <div className="relative">
            <label htmlFor="movementType" className="block text-sm font-medium text-slate-700 mb-1">
              Movement Type
            </label>
            <select
              id="movementType"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              required
            >
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          
          <div className="relative">
            <label htmlFor="referenceNumber" className="block text-sm font-medium text-slate-700 mb-1">
              Reference Number (Optional)
            </label>
            <input
              id="referenceNumber"
              type="text"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., Order #123, Invoice #456"
            />
          </div>
          
          <div className="relative">
            <label htmlFor="note" className="block text-sm font-medium text-slate-700 mb-1">
              Note (Optional)
            </label>
            <textarea
              id="note"
              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white text-base resize-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows="2"
              placeholder="Add any additional information here"
            />
          </div>
          
          <div className="pt-4">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default QuantityUpdate;
