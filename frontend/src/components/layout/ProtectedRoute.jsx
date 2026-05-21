// src/components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        background: 'var(--color-bg-page)'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid var(--color-primary-subtle)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }
  
  return token ? children : <Navigate to="/login" replace />
}
