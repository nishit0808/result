import { useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = (message) => {
    setToasts((prevToasts) => [...prevToasts, message]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.slice(1));
    }, 3000); // Auto-dismiss after 3 seconds
  };

  return { toast, toasts };
}
