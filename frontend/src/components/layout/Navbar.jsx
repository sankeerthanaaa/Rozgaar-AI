// src/components/layout/Navbar.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navLinks = [
    { label: 'Home',           to: '/' },
    { label: 'Check ATS',      to: '/ats' },
    { label: 'Interview Prep', to: '/interview' },
  ]

  function closeSidebar() { setSidebarOpen(false) }

  return (
    <>
      {/* ── Main navbar ── */}
      <nav style={{
        position:       'sticky',
        top:            0,
        zIndex:         100,
        height:         'var(--navbar-height)',
        background:     'rgba(244,243,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom:   '1px solid var(--color-border-surface)',
        display:        'flex',
        alignItems:     'center',
        paddingInline:  'var(--container-pad)',
      }}>
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          width:          '100%',
          maxWidth:       'var(--container-max)',
          margin:         '0 auto',
        }}>

          {/* Left: hamburger (mobile/tablet) + logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Hamburger — shown on mobile/tablet via CSS, hidden on desktop */}
            <button
              className="nav-hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6"  x2="19" y2="6"  />
                <line x1="3" y1="11" x2="19" y2="11" />
                <line x1="3" y1="16" x2="19" y2="16" />
              </svg>
            </button>

            {/* Logo */}
            <Link to="/" style={{
              fontFamily:     'var(--font-display)',
              fontWeight:     'var(--weight-bold)',
              fontSize:       'var(--text-lg)',
              color:          'var(--color-text-primary)',
              textDecoration: 'none',
            }}>
              RozgaarAI
            </Link>
          </div>

          {/* Center: Nav links — hidden on mobile/tablet via CSS class */}
          <div className="nav-links-desktop" style={{ gap: 'var(--space-8)', alignItems: 'center' }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} style={{
                fontSize:       'var(--text-sm)',
                fontWeight:     pathname === link.to ? 'var(--weight-medium)' : 'var(--weight-regular)',
                color:          pathname === link.to ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition:     'color var(--transition-fast)',
              }}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: Auth area — always visible */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            {user ? (
              <>
                <Link to="/dashboard" style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--color-primary-subtle)',
                  border: '1.5px solid var(--color-primary-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-xs)', color: 'var(--color-primary)',
                  textDecoration: 'none',
                }}>
                  {user.name?.slice(0,2).toUpperCase() || 'U'}
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={logout} style={{ minHeight: 36 }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
                  textDecoration: 'none',
                }}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-dark btn-sm">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile sidebar backdrop ── */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Mobile sidebar panel ── */}
      <aside className={`mobile-sidebar${sidebarOpen ? ' open' : ''}`} aria-label="Navigation menu">
        {/* Sidebar header */}
        <div className="sidebar-header">
          <Link to="/" onClick={closeSidebar} style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--weight-bold)',
            fontSize:   'var(--text-md)',
            color:      'var(--color-text-primary)',
            textDecoration: 'none',
          }}>
            RozgaarAI
          </Link>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4"  x2="16" y2="16" />
              <line x1="16" y1="4" x2="4"  y2="16" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        {navLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link${pathname === link.to ? ' active' : ''}`}
            onClick={closeSidebar}
          >
            {link.label}
          </Link>
        ))}

        {/* Dashboard link if logged in */}
        {user && (
          <Link
            to="/dashboard"
            className={`sidebar-link${pathname === '/dashboard' ? ' active' : ''}`}
            onClick={closeSidebar}
          >
            Dashboard
          </Link>
        )}

        <div className="sidebar-divider" />

        {/* Auth section */}
        <div className="sidebar-auth">
          {user ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-bg-surface-2)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--color-primary-subtle)',
                  border: '1.5px solid var(--color-primary-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 'var(--weight-bold)',
                  fontSize: 'var(--text-xs)', color: 'var(--color-primary)',
                  flexShrink: 0,
                }}>
                  {user.name?.slice(0,2).toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-primary)' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', color: 'var(--color-danger)', borderColor: 'var(--color-danger-bg)' }}
                onClick={() => { logout(); closeSidebar() }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ width: '100%', textAlign: 'center' }} onClick={closeSidebar}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-dark btn-sm" style={{ width: '100%', textAlign: 'center' }} onClick={closeSidebar}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  )
}