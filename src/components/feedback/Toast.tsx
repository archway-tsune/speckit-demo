'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// ─────────────────────────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  showToast: (message: string, type: ToastType) => void;
}

// ─────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────
// 自動消去時間（ms）
// ─────────────────────────────────────────────────────────────────

const DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  error: 5000,
};

// ─────────────────────────────────────────────────────────────────
// スタイル
// ─────────────────────────────────────────────────────────────────

const STYLE: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

// ─────────────────────────────────────────────────────────────────
// Toast 表示コンポーネント
// ─────────────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, DURATION[toast.type]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onRemove]);

  return (
    <div
      role="alert"
      className={`mb-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${STYLE[toast.type]}`}
    >
      {toast.message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (!message) return;
    const id = String(++toastCounter);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col items-end">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
