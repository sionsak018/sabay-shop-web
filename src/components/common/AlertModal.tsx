import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'success',
  confirmText = 'Yes',
  cancelText = 'No'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1d] rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center border dark:border-gray-800 animate-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          {(type === 'success') && (
            <div className="w-20 h-20 rounded-full border-4 border-green-100 dark:border-green-900/30 flex items-center justify-center text-green-500 animate-in bounce-in duration-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {type === 'error' && (
            <div className="w-20 h-20 rounded-full border-4 border-red-100 dark:border-red-900/30 flex items-center justify-center text-red-500 animate-in bounce-in duration-500">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          {(type === 'warning' || type === 'confirm') && (
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center animate-in bounce-in duration-500 ${type === 'confirm' ? 'border-blue-100 dark:border-blue-900/30 text-blue-500' : 'border-yellow-100 dark:border-yellow-900/30 text-yellow-500'}`}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight">{title}</h3>
        <div className="text-gray-500 dark:text-gray-400 font-bold mb-8 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: message }} />

        {type === 'confirm' ? (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 text-sm uppercase tracking-widest transition-all active:scale-95 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl font-black text-white bg-blue-600 text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className={`w-full py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
              type === 'success' ? 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700' :
              type === 'error' ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700' :
              'bg-yellow-600 shadow-yellow-600/20 hover:bg-yellow-700'
            }`}
          >
            Close
          </button>
        )}
      </div>
    </div>

  );
};
