import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  showCloseButton?: boolean;
  preventClose?: boolean; // Prevenir cierre del modal (útil durante operaciones)
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  type = 'info',
  showCloseButton = true,
  preventClose = false,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return 'border-red-200';
      case 'success':
        return 'border-green-200';
      default:
        return 'border-blue-200';
    }
  };

  const handleBackdropClick = () => {
    if (!preventClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 border ${getBorderColor()}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {showCloseButton && (
            <button
              onClick={preventClose ? undefined : onClose}
              disabled={preventClose}
              className={`p-2 rounded-lg transition-colors ${
                preventClose 
                  ? "text-gray-300 cursor-not-allowed" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning',
  isLoading = false,
}) => {
  // Debug: Log cuando cambia el estado de loading
  React.useEffect(() => {
    if (isLoading) {
      console.log('🔄 ConfirmModal: isLoading cambió a true');
    }
  }, [isLoading]);

  const handleConfirm = () => {
    if (!isLoading) {
      console.log('✅ ConfirmModal: handleConfirm llamado');
      onConfirm();
    } else {
      console.log('⚠️ ConfirmModal: handleConfirm bloqueado, isLoading es true');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    } else {
      console.log('⚠️ ConfirmModal: handleClose bloqueado, isLoading es true');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      type={type}
      showCloseButton={false}
      preventClose={isLoading}
    >
      <div className="space-y-4">
        <p className="text-gray-600 leading-relaxed">{message}</p>
        
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-orange-700">Cancelando turno...</span>
          </div>
        )}
        
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : type === 'error' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cancelando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};