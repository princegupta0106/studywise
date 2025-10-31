import React from 'react'

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-yellow-500 hover:bg-yellow-600 text-black',
  isLoading = false 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 max-w-md w-full mx-4" style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <p className="mb-6" style={{color: 'var(--text)'}}>{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm rounded transition-colors font-medium disabled:opacity-50"
            style={{background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)'}}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm rounded transition-colors font-medium disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}