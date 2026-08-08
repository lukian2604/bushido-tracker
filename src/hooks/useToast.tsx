import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

interface ToastItem {
  id: number
  message: string
  isVisible: boolean
}

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string) => {
    const id = idRef.current++
    setToasts((current) => [...current, { id, message, isVisible: false }])

    requestAnimationFrame(() => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, isVisible: true } : toast)))
    })

    setTimeout(() => {
      setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, isVisible: false } : toast)))
      setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, 300)
    }, 2600)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3 text-sm text-(--color-parchment) shadow-lg transition-all duration-300 ${
              toast.isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
