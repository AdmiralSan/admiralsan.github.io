import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const ProductImageUpload = ({ productId, onClose, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder2MB = file.size <= 2 * 1024 * 1024; // 2MB limit
      return isImage && isUnder2MB;
    });

    if (validFiles.length < files.length) {
      setError('Some files were skipped. Images must be under 2MB in size.');
    }

    // Create preview URLs for display
    const newFilesWithPreviews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false
    }));

    setNewFiles(prev => [...prev, ...newFilesWithPreviews]);
    setError(null);
  };

  const removeNewFile = (index) => {
    const updatedFiles = [...newFiles];
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(updatedFiles[index].preview);
    updatedFiles.splice(index, 1);
    setNewFiles(updatedFiles);
  };

  const removeExistingImage = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      // First get the image path
      const imageToDelete = images.find(img => img.id === imageId);
      if (!imageToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([imageToDelete.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Update state
      setImages(images.filter(img => img.id !== imageId));
      
    } catch (error) {
      setError(`Failed to delete image: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newFiles.length === 0) {
      onClose();
      return;
    }
    
    setUploading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Upload each file and track progress
      const totalFiles = newFiles.length;
      let completedFiles = 0;
      
      for (let i = 0; i < newFiles.length; i++) {
        const fileData = newFiles[i];
        const file = fileData.file;
        
        // Update state to show which file is uploading
        setNewFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: true };
          return updated;
        });
        
        // Generate a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const filePath = `${productId}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        const publicUrl = data.publicUrl;
        
        // Save reference in database
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: publicUrl,
            path: filePath,
            alt_text: file.name.split('.')[0], // Use filename as alt text
            is_primary: images.length === 0 && i === 0 // First image is primary if no existing images
          });
          
        if (dbError) throw dbError;
        
        // Update progress
        completedFiles++;
        setProgress(Math.round((completedFiles / totalFiles) * 100));
        
        // Mark file as completed in UI
        setNewFiles(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploading: false, completed: true };
          return updated;
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      newFiles.forEach(fileData => {
        if (fileData.preview) {
          URL.revokeObjectURL(fileData.preview);
        }
      });
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Manage Product Images
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            disabled={uploading}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Existing Images */}
          {images.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-slate-700 mb-3">Current Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={image.url}
                        alt={image.alt_text || "Product image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="p-1.5 bg-red-500 rounded-full text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {image.is_primary && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div className="mb-6">
            <h3 className="font-medium text-slate-700 mb-3">Upload New Images</h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-slate-600">
                  Drag images here or click to upload
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG up to 2MB
                </p>
              </label>
            </div>
          </div>

          {/* Preview of files to upload */}
          {newFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-slate-700 mb-3">Files to Upload</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {newFiles.map((fileData, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={fileData.preview}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          className="p-1.5 bg-red-500 rounded-full text-white"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {fileData.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {fileData.completed && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="p-1.5 bg-green-500 rounded-full">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="mb-6">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-slate-600 mt-1 text-center">
                Uploading: {progress}% complete
              </p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm mb-4"
            >
              {error}
            </motion.div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              className="btn-primary"
              whileTap={{ scale: 0.97 }}
              disabled={uploading && !success}
            >
              {uploading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : success ? (
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved!
                </span>
              ) : (
                'Save Images'
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ProductImageUpload;
