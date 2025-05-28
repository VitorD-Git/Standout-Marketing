
import React from 'react';
import { XCircleIcon } from './icons/IconComponents';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      <div className={`bg-white rounded-lg shadow-xl p-6 m-4 ${sizeClasses[size]} w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-secondary-700">{title}</h2>
          <button
            onClick={onClose}
            className="text-secondary-500 hover:text-secondary-700 transition-colors"
            aria-label="Close modal"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
      {/* The @keyframes modalShow is defined in index.html, so local style is not needed here */}
    </div>
  );
};

export default Modal;