import toast from 'react-hot-toast';

const baseOptions = {
  duration: 4000, // ⏱ thời gian toast tồn tại
  className: 'animate-toast', // 💥 áp hiệu ứng CSS
  style: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #4caf50',
    fontWeight: '500',
    fontSize: '14px',
  },
};

const useToast = () => {
  const success = (title = 'Thành công', description = '') => {
    toast.success(`${title}${description ? ': ' + description : ''}`, {
      ...baseOptions,
      style: {
        ...baseOptions.style,
        border: '1px solid #4caf50',
        background: '#e8f5e9',
        color: '#2e7d32',
      },
    });
  };

  const error = (title = 'Thất bại', description = '') => {
    toast.error(`${title}${description ? ': ' + description : ''}`, {
      ...baseOptions,
      style: {
        ...baseOptions.style,
        border: '1px solid #f44336',
        background: '#ffebee',
        color: '#c62828',
      },
    });
  };

  const warning = (title = 'Cảnh báo', description = '') => {
    toast(`${title}${description ? ': ' + description : ''}`, {
      icon: '⚠️',
      ...baseOptions,
      style: {
        ...baseOptions.style,
        border: '1px solid #ff9800',
        background: '#fff3e0',
        color: '#ef6c00',
      },
    });
  };

  const info = (title = 'Thông tin', description = '') => {
    toast(`${title}${description ? ': ' + description : ''}`, {
      icon: 'ℹ️',
      ...baseOptions,
      style: {
        ...baseOptions.style,
        border: '1px solid #2196f3',
        background: '#e3f2fd',
        color: '#1565c0',
      },
    });
  };

  return { success, error, warning, info };
};

export default useToast;
