'use client';

import * as React from 'react';
import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, useCallback } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
  swipeDirection?: 'right' | 'left' | 'up' | 'down';
  defaultDuration?: number;
}

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  title?: string;
  duration: number;
}

export function ToastProvider({
  children,
  swipeDirection = 'right',
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [openToasts, setOpenToasts] = useState<Record<string, boolean>>({});

  const toast = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      title?: string,
      duration = defaultDuration,
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      setToasts(prev => [...prev, { id, message, variant, title, duration }]);
      setOpenToasts(prev => ({ ...prev, [id]: true }));
    },
    [defaultDuration],
  );

  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenToasts(prev => ({ ...prev, [id]: open }));

    if (!open) {
      // Remove toast from array after animation completes
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 300);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection={swipeDirection}>
        {children}

        {toasts.map(toast => (
          <Toast.Root
            key={toast.id}
            className={`toast-root toast-${toast.variant}`}
            open={openToasts[toast.id]}
            onOpenChange={open => handleOpenChange(toast.id, open)}
            duration={toast.duration}
          >
            {toast.title && <Toast.Title className="toast-title">{toast.title}</Toast.Title>}
            <Toast.Description className="toast-description">{toast.message}</Toast.Description>
            <Toast.Close className="toast-close" aria-label="Close">
              <span aria-hidden>×</span>
            </Toast.Close>
          </Toast.Root>
        ))}

        <Toast.Viewport className="toast-viewport" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Create a custom hook for each toast type
export function useToastHelpers() {
  const { toast } = useToast();

  return {
    success: (message: string, title?: string, duration?: number) => {
      toast(message, 'success', title, duration);
    },
    error: (message: string, title?: string, duration?: number) => {
      toast(message, 'error', title, duration);
    },
    warning: (message: string, title?: string, duration?: number) => {
      toast(message, 'warning', title, duration);
    },
    info: (message: string, title?: string, duration?: number) => {
      toast(message, 'info', title, duration);
    },
  };
}
