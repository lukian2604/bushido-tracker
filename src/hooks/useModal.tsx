import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from './useTranslation'

interface ModalOptions {
  confirmLabel?: string
  defaultValue?: string
}

interface ModalState {
  message: string
  withInput: boolean
  defaultValue: string
  confirmLabel: string
  cancelLabel: string
}

interface ModalContextValue {
  confirmDialog: (message: string, options?: ModalOptions) => Promise<boolean>
  promptDialog: (message: string, options?: ModalOptions) => Promise<string | null>
}

const ModalContext = createContext<ModalContextValue | null>(null)

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation()
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [inputValue, setInputValue] = useState('')
  const resolveRef = useRef<((value: string | boolean | null) => void) | null>(null)

  const open = useCallback((state: ModalState) => {
    return new Promise<string | boolean | null>((resolve) => {
      resolveRef.current = resolve
      setInputValue(state.defaultValue)
      setModalState(state)
    })
  }, [])

  const close = useCallback((result: string | boolean | null) => {
    setModalState(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }, [])

  const confirmDialog = useCallback((message: string, options: ModalOptions = {}) => {
    return open({
      message,
      withInput: false,
      defaultValue: '',
      confirmLabel: options.confirmLabel ?? t('common.delete'),
      cancelLabel: t('common.cancel'),
    }) as Promise<boolean>
  }, [open, t])

  const promptDialog = useCallback((message: string, options: ModalOptions = {}) => {
    return open({
      message,
      withInput: true,
      defaultValue: options.defaultValue ?? '',
      confirmLabel: options.confirmLabel ?? t('common.save'),
      cancelLabel: t('common.cancel'),
    }) as Promise<string | null>
  }, [open, t])

  const handleConfirm = () => {
    close(modalState?.withInput ? inputValue.trim() : true)
  }

  const handleCancel = () => {
    close(modalState?.withInput ? null : false)
  }

  const value = useMemo(() => ({ confirmDialog, promptDialog }), [confirmDialog, promptDialog])

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modalState && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) handleCancel() }}
        >
          <div role="dialog" aria-modal="true" className="w-full max-w-105 rounded-2xl border border-(--color-border) bg-(--color-surface) p-7 shadow-xl">
            <p className="mb-5 leading-relaxed text-(--color-parchment)">{modalState.message}</p>
            {modalState.withInput && (
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleConfirm() }}
                className="mb-5 w-full rounded-lg border border-(--color-border) bg-(--color-ink) px-3.5 py-2.5 text-(--color-parchment) outline-none focus:border-(--color-accent)"
              />
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-(--color-border) px-4 py-2 text-sm text-(--color-parchment-muted) hover:text-(--color-parchment)"
              >
                {modalState.cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {modalState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
