// src/pages/LinkedInCallbackPage.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate }                  from 'react-router'
import toast                            from 'react-hot-toast'
import linkedinService                  from '../services/linkedinService'

/**
 * Handles the OAuth redirect from LinkedIn.
 * URL shape: /linkedin/callback?code=xxx&state=yyy
 *
 * Flow:
 *  1. Read ?code & ?state from URL
 *  2. Verify state matches what we stored in sessionStorage (CSRF guard)
 *  3. Call GET /api/linkedin/callback?code=xxx  → get profile + accessToken
 *  4. Call POST /api/linkedin/import { accessToken } → get resumeData
 *  5. Persist resumeData in sessionStorage so ATSPage can read it
 *  6. Redirect to /ats
 */
export default function LinkedInCallbackPage() {
  const navigate   = useNavigate()
  const [status, setStatus]   = useState('Connecting to LinkedIn…')
  const [isError, setIsError] = useState(false)
  const ran = useRef(false)   // guard against React 18 double-invoke in dev

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function processCallback() {
      const params       = new URLSearchParams(window.location.search)
      const code         = params.get('code')
      const returnedState = params.get('state')
      const storedState  = sessionStorage.getItem('linkedin_oauth_state')

      // ── Error from LinkedIn (user denied access, etc.) ──────────────────
      const error = params.get('error')
      if (error) {
        setIsError(true)
        setStatus(`LinkedIn error: ${params.get('error_description') || error}`)
        toast.error('LinkedIn authorisation failed.')
        setTimeout(() => navigate('/ats', { replace: true }), 3000)
        return
      }

      // ── Missing code ─────────────────────────────────────────────────────
      if (!code) {
        setIsError(true)
        setStatus('No authorisation code received from LinkedIn.')
        setTimeout(() => navigate('/ats', { replace: true }), 3000)
        return
      }

      // ── CSRF state check ─────────────────────────────────────────────────
      if (storedState && returnedState && storedState !== returnedState) {
        setIsError(true)
        setStatus('State mismatch — possible CSRF attempt. Please try again.')
        setTimeout(() => navigate('/ats', { replace: true }), 3000)
        return
      }

      sessionStorage.removeItem('linkedin_oauth_state')

      try {
        // Step 1 — Exchange code for profile + accessToken
        setStatus('Exchanging authorisation code…')
        const callbackRes = await linkedinService.handleCallback(code)

        if (!callbackRes.success) {
          throw new Error('Backend returned failure on callback exchange.')
        }

        const profile     = callbackRes.data?.profile  || callbackRes.data || {}
        const accessToken = callbackRes.data?.accessToken

        // Step 2 — Import resume data (only if backend returns accessToken)
        let resumeData = profile
        if (accessToken) {
          setStatus('Importing your LinkedIn profile…')
          const importRes = await linkedinService.importLinkedinProfile(accessToken)
          if (importRes.success) {
            resumeData = importRes.data
          }
        }

        // Persist so ATSPage can pick it up
        sessionStorage.setItem('linkedin_resume_data', JSON.stringify(resumeData))

        toast.success('LinkedIn profile imported! 🎉', { position: 'top-center' })
        navigate('/ats', { replace: true })

      } catch (err) {
        console.error('[LinkedInCallback]', err)
        const msg = err.response?.data?.message || err.message || 'Unknown error'
        setIsError(true)
        setStatus(`Import failed: ${msg}`)
        toast.error('Could not import LinkedIn profile.')
        setTimeout(() => navigate('/ats', { replace: true }), 4000)
      }
    }

    processCallback()
  }, [navigate])

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            'var(--space-5)',
      background:     'var(--color-bg)',
      padding:        'var(--space-8)',
    }}>

      {/* LinkedIn logo */}
      <div style={{
        width:          64,
        height:         64,
        borderRadius:   16,
        background:     isError ? '#ef4444' : '#0A66C2',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      isError
          ? '0 4px 20px rgba(239,68,68,0.35)'
          : '0 4px 20px rgba(10,102,194,0.35)',
        transition:     'background 0.3s ease',
      }}>
        {isError ? (
          // ✕ icon
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5"
              strokeLinecap="round"/>
          </svg>
        ) : (
          // LinkedIn "in" logo
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853
              0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85
              3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0
              01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
          </svg>
        )}
      </div>

      {/* Spinner (only while loading) */}
      {!isError && (
        <div style={{
          width:        36,
          height:       36,
          borderRadius: '50%',
          border:       '3px solid var(--color-border)',
          borderTop:    '3px solid #0A66C2',
          animation:    'li-spin 0.9s linear infinite',
        }} />
      )}

      <p style={{
        fontSize:   'var(--text-base)',
        fontWeight: 'var(--weight-medium)',
        color:      isError ? 'var(--color-danger)' : 'var(--color-text-primary)',
        textAlign:  'center',
        maxWidth:   360,
      }}>
        {status}
      </p>

      {isError && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' }}>
          Redirecting you back in a moment…
        </p>
      )}

      <style>{`@keyframes li-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
