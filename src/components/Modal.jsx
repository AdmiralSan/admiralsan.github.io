  import React, { useEffect, useRef } from 'react';

const Modal = ({ children, handleClose }) => {
  const modalRef = useRef();

  // Close on escape key press
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [handleClose]);

  // Close when clicking outside the modal
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleOutsideClick}>
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Modal;