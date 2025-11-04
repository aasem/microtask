import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast = ({ message, type, onClose, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-success',
    error: 'bg-red-50 border-danger',
    info: 'bg-blue-50 border-blue-500',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColors[type]} border-l-4 rounded shadow-lg p-4 flex items-center space-x-3 max-w-md`}>
      <div>{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
