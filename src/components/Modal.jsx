import { useEffect } from 'react'

export default function Modal({ open, onClose, title, subtitle, icon = '📋', children, maxWidth = 500 }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        animation: 'fadeIn 200ms ease both',
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div
        className="modal-box max-h-[90vh] max-h-screen overflow-hidden flex flex-col"
        style={{
          maxWidth,
          animation: 'scaleIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-2xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg, var(--primary-50), #e0f2fe)',
          borderBottom: '1px solid var(--primary-100)',
          padding: '20px 24px 16px',
        }}>
          <div className="modal-header-left">
            <div className="modal-icon" style={{
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              color: 'white',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            }}>
              {icon}
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--gray-900)' }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 2 }}>{subtitle}</p>}
            </div>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            title="Tutup"
            style={{
              width: 34, height: 34,
              border: 'none',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gray-500)',
              fontSize: 17,
              transition: 'all 0.15s',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = 'var(--gray-500)' }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body overflow-y-auto" style={{ padding: '20px 24px 24px', flex: '1 1 auto', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
