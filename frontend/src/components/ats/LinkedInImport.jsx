// src/components/ats/LinkedInImport.jsx
import { useState }    from 'react'
import linkedinService from '../../services/linkedinService'

const LI_BLUE  = '#0A66C2'
const LI_HOVER = '#004182'
const SUCCESS   = '#16a34a'

/**
 * Props:
 *   importedProfile — { name, email, picture? } | null
 *                     When set, shows the "connected" success state instead of the connect button.
 *   onReconnect     — () => void  called when user clicks "Reconnect"
 */
export default function LinkedInImport({ importedProfile, onReconnect }) {
  const [connecting, setConnecting] = useState(false)

  function handleConnect() {
    setConnecting(true)
    linkedinService.redirectToLinkedIn()
  }

  // ── Connected / success state ────────────────────────────────────────────
  if (importedProfile) {
    const displayName = importedProfile.name || importedProfile.given_name || 'LinkedIn User'
    const email       = importedProfile.email || ''

    return (
      <div style={{
        background:    'var(--color-bg-surface-2)',
        border:        '1px solid #16a34a44',
        borderRadius:  'var(--radius-xl)',
        padding:       'var(--space-8)',
        display:       'flex',
        alignItems:    'center',
        gap:           'var(--space-5)',
      }}>

        {/* Green checkmark badge */}
        <div style={{
          width:          52,
          height:         52,
          borderRadius:   '50%',
          background:     '#dcfce7',
          border:         '2px solid #16a34a33',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke={SUCCESS} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Name + status text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            {/* tiny LinkedIn "in" badge */}
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              background: LI_BLUE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853
                  0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85
                  3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0
                  01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
              </svg>
            </div>
            <p style={{
              fontSize:   'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color:      SUCCESS,
              margin:     0,
            }}>
              LinkedIn Connected
            </p>
          </div>

          <p style={{
            fontSize:     'var(--text-base)',
            fontWeight:   'var(--weight-medium)',
            color:        'var(--color-text-primary)',
            margin:       0,
            marginBottom: email ? 'var(--space-1)' : 0,
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
          }}>
            {displayName}
          </p>

          {email && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color:    'var(--color-text-tertiary)',
              margin:   0,
            }}>
              {email}
            </p>
          )}
        </div>

        {/* Reconnect button */}
        <button
          id="linkedin-reconnect-btn"
          onClick={onReconnect || handleConnect}
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          'var(--space-2)',
            padding:      '7px 14px',
            borderRadius: 'var(--radius-md)',
            border:       '1px solid var(--color-border)',
            background:   'var(--color-bg-surface)',
            color:        'var(--color-text-secondary)',
            fontSize:     'var(--text-xs)',
            fontWeight:   'var(--weight-medium)',
            cursor:       'pointer',
            flexShrink:   0,
            transition:   'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = LI_BLUE
            e.currentTarget.style.color       = LI_BLUE
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--color-border)'
            e.currentTarget.style.color       = 'var(--color-text-secondary)'
          }}
        >
          {/* refresh icon */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6M23 20v-6h-6"/>
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
          </svg>
          Reconnect
        </button>
      </div>
    )
  }

  // ── Default: connect button state ────────────────────────────────────────
  return (
    <div style={{
      background:    'var(--color-bg-surface-2)',
      border:        '1px solid var(--color-border)',
      borderRadius:  'var(--radius-xl)',
      padding:       'var(--space-10) var(--space-8)',
      textAlign:     'center',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           'var(--space-5)',
    }}>

      {/* LinkedIn logo mark */}
      <div style={{
        width:          56,
        height:         56,
        borderRadius:   14,
        background:     LI_BLUE,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        boxShadow:      `0 4px 16px ${LI_BLUE}44`,
      }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853
            0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85
            3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0
            01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
        </svg>
      </div>

      <div>
        <p style={{
          fontSize:     'var(--text-base)',
          fontWeight:   'var(--weight-semibold)',
          color:        'var(--color-text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          Import from LinkedIn
        </p>
        <p style={{
          fontSize:   'var(--text-sm)',
          color:      'var(--color-text-tertiary)',
          maxWidth:   340,
          lineHeight: 1.5,
        }}>
          Connect your LinkedIn account to automatically populate your resume
          with your profile data — experience, skills, education and more.
        </p>
      </div>

      <button
        id="linkedin-connect-btn"
        onClick={handleConnect}
        disabled={connecting}
        style={{
          display:    'inline-flex',
          alignItems: 'center',
          gap:        'var(--space-2)',
          padding:    '10px 22px',
          borderRadius: 'var(--radius-md)',
          border:      'none',
          background:  connecting ? '#6b7280' : LI_BLUE,
          color:       '#fff',
          fontSize:    'var(--text-sm)',
          fontWeight:  'var(--weight-semibold)',
          cursor:      connecting ? 'not-allowed' : 'pointer',
          transition:  'background 0.2s ease',
          boxShadow:   connecting ? 'none' : `0 2px 8px ${LI_BLUE}55`,
        }}
        onMouseEnter={e => { if (!connecting) e.currentTarget.style.background = LI_HOVER }}
        onMouseLeave={e => { if (!connecting) e.currentTarget.style.background = LI_BLUE  }}
      >
        {connecting ? (
          <>
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid #fff',
              animation: 'spin 0.8s linear infinite',
              display: 'inline-block',
            }} />
            Redirecting…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853
                0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85
                3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0
                01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
            </svg>
            Connect LinkedIn
          </>
        )}
      </button>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
        You'll be redirected to LinkedIn to authorise — we never store your password.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}