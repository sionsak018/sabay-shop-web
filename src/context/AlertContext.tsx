import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertModal } from '../components/common/AlertModal';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '', message: '' });

  const showAlert = (newOptions: AlertOptions) => {
    setOptions(newOptions);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (options.onClose) {
      options.onClose();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={isOpen}
        onClose={handleClose}
        title={options.title}
        message={options.message}
        type={options.type}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
