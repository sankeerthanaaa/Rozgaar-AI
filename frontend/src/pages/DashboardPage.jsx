// src/pages/DashboardPage.jsx
import { useState }    from 'react'
import { useNavigate } from 'react-router'
import { useAuth }     from '../context/AuthContext'
import { timeAgo }     from '../utils/formatDate'
import { scoreBadgeVariant } from '../utils/scoreColor'

const MOCK_HISTORY = [
  {
    id: 1,
    filename:  'resume_swe_v3.pdf',
    role:      'Software Engineer',
    atsScore:  91,
    jdMatch:   88,
    source:    'upload',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 2,
    filename:  'linkedin_import.pdf',
    role:      'Product Manager',
    atsScore:  67,
    jdMatch:   61,
    source:    'linkedin',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 3,
    filename:  'resume_da_v1.pdf',
    role:      'Data Analyst',
    atsScore:  54,
    jdMatch:   48,
    source:    'upload',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 4,
    filename:  'resume_fe_dev.pdf',
    role:      'Frontend Developer',
    atsScore:  83,
    jdMatch:   79,
    source:    'upload',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
  },
]

function scoreColor(score) {
  if (score >= 75) return 'var(--color-success)'
  if (score >= 50) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function scoreBg(score) {
  if (score >= 75) return 'var(--color-success-bg)'
  if (score >= 50) return 'var(--color-warning-bg)'
  return 'var(--color-danger-bg)'
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [history, setHistory] = useState(MOCK_HISTORY)
  const [search,  setSearch]  = useState('')

  const name      = user?.name || 'there'
  const initials  = name.slice(0, 2).toUpperCase()
  const bestScore = Math.max(...history.map(r => r.atsScore))
  const avgJd     = Math.round(history.reduce((a, r) => a + r.jdMatch, 0) / history.length)
  const bestEntry = history.find(r => r.atsScore === bestScore)

  const filtered = history.filter(r =>
    r.filename.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id) {
    setHistory(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 280px',
        gap:                 'var(--space-8)',
        alignItems:          'start',
      }}>

        {/* ══ LEFT COLUMN ══ */}
        <div>

          {/* Greeting */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ marginBottom: 'var(--space-1)' }}>
              Hello, {name.split(' ')[0]} 👋
            </h2>
            <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
              Here's how your resumes are performing
            </p>
          </div>

          {/* ── Stat cards ── */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 'var(--space-4)',
            marginBottom:        'var(--space-8)',
          }}>

            {/* Best ATS score */}
            <div className="stat-card">
              <div className="stat-label">Best ATS score</div>
              <div className="stat-value" style={{ color: scoreColor(bestScore) }}>
                {bestScore}
              </div>
              <p style={{
                fontSize:  'var(--text-xs)',
                color:     'var(--color-text-tertiary)',
                marginTop: 'var(--space-1)',
              }}>
                {bestEntry?.role || '—'}
              </p>
            </div>

            {/* Resumes analyzed */}
            <div className="stat-card">
              <div className="stat-label">Resumes analyzed</div>
              <div className="stat-value">{history.length}</div>
              <p style={{
                fontSize:  'var(--text-xs)',
                color:     'var(--color-text-tertiary)',
                marginTop: 'var(--space-1)',
              }}>
                across {new Set(history.map(r => r.role)).size} roles
              </p>
            </div>

            {/* Avg JD match */}
            <div className="stat-card">
              <div className="stat-label">Avg JD match</div>
              <div className="stat-value">{avgJd}%</div>
              <p style={{
                fontSize:  'var(--text-xs)',
                color:     'var(--color-text-tertiary)',
                marginTop: 'var(--space-1)',
              }}>
                last 30 days
              </p>
            </div>
          </div>

          {/* ── History table ── */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              marginBottom:   'var(--space-4)',
              flexWrap:       'wrap',
              gap:            'var(--space-3)',
            }}>
              <h3 style={{ fontSize: 'var(--text-md)' }}>
                Resume history
              </h3>
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Search by file or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div style={{
              background:   'var(--color-bg-surface)',
              border:       '1px solid var(--color-border-surface)',
              borderRadius: 'var(--radius-lg)',
              overflow:     'hidden',
            }}>

              {/* Table header */}
              <div style={{
                display:             'grid',
                gridTemplateColumns: '2fr 1.2fr 80px 80px 100px 80px',
                padding:             'var(--space-3) var(--space-5)',
                background:          'var(--color-bg-surface-2)',
                borderBottom:        '1px solid var(--color-border-surface)',
              }}>
                {['File', 'Role', 'ATS', 'JD match', 'Date', 'Actions'].map(h => (
                  <span key={h} style={{
                    fontSize:      'var(--text-xs)',
                    fontWeight:    'var(--weight-medium)',
                    color:         'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{
                  padding:   'var(--space-12)',
                  textAlign: 'center',
                }}>
                  <p className="text-tertiary" style={{ fontSize: 'var(--text-sm)' }}>
                    No resumes found
                  </p>
                </div>
              ) : (
                filtered.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display:             'grid',
                      gridTemplateColumns: '2fr 1.2fr 80px 80px 100px 80px',
                      padding:             'var(--space-4) var(--space-5)',
                      borderBottom:        i < filtered.length - 1
                        ? '1px solid var(--color-border-surface)'
                        : 'none',
                      alignItems:          'center',
                      transition:          'background var(--transition-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* File */}
                    <div>
                      <div style={{
                        fontSize:  'var(--text-sm)',
                        fontWeight:'var(--weight-medium)',
                        color:     'var(--color-text-primary)',
                        marginBottom: 2,
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                        maxWidth:     200,
                      }}>
                        {r.filename}
                      </div>
                      <span className="badge badge-purple" style={{ fontSize: 10 }}>
                        {r.source === 'linkedin' ? 'LinkedIn' : 'Upload'}
                      </span>
                    </div>

                    {/* Role */}
                    <span style={{
                      fontSize:     'var(--text-xs)',
                      color:        'var(--color-text-secondary)',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}>
                      {r.role}
                    </span>

                    {/* ATS score */}
                    <div style={{
                      display:        'inline-flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      width:           42,
                      height:          42,
                      borderRadius:   '50%',
                      background:     scoreBg(r.atsScore),
                      fontFamily:     'var(--font-display)',
                      fontSize:       'var(--text-sm)',
                      fontWeight:     'var(--weight-bold)',
                      color:          scoreColor(r.atsScore),
                    }}>
                      {r.atsScore}
                    </div>

                    {/* JD match */}
                    <div>
                      <div style={{
                        fontSize:     'var(--text-sm)',
                        fontWeight:   'var(--weight-medium)',
                        color:        scoreColor(r.jdMatch),
                        marginBottom: 4,
                      }}>
                        {r.jdMatch}%
                      </div>
                      <div className="progress-track" style={{ height: 4 }}>
                        <div
                          className={`progress-fill ${
                            r.jdMatch >= 75 ? 'success' :
                            r.jdMatch >= 50 ? 'warning' : ''
                          }`}
                          style={{ width: `${r.jdMatch}%` }}
                        />
                      </div>
                    </div>

                    {/* Date */}
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color:    'var(--color-text-tertiary)',
                    }}>
                      {timeAgo(r.createdAt)}
                    </span>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding:     '4px 10px',
                          fontSize:    10,
                          color:       'var(--color-primary)',
                          borderColor: 'var(--color-primary-muted)',
                        }}
                        onClick={() => navigate('/ats')}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{
                          padding:     '4px 10px',
                          fontSize:    10,
                          color:       'var(--color-danger)',
                          borderColor: 'var(--color-danger-bg)',
                        }}
                        onClick={() => handleDelete(r.id)}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Analyze new resume CTA */}
          <button
            className="btn btn-primary"
            onClick={() => navigate('/ats')}
          >
            Analyze new resume
          </button>
        </div>

        {/* ══ RIGHT COLUMN — profile panel ══ */}
        <div style={{
          position: 'sticky',
          top:      'calc(var(--navbar-height) + var(--space-6))',
          display:  'flex',
          flexDirection: 'column',
          gap:      'var(--space-4)',
        }}>

          {/* Avatar + name */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
              width:          64,
              height:         64,
              borderRadius:   '50%',
              background:     'var(--color-primary-subtle)',
              border:         '2px solid var(--color-primary-muted)',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontFamily:     'var(--font-display)',
              fontSize:       'var(--text-lg)',
              fontWeight:     'var(--weight-bold)',
              color:          'var(--color-primary)',
              margin:         '0 auto var(--space-3)',
            }}>
              {initials}
            </div>

            <p style={{
              fontFamily:   'var(--font-display)',
              fontSize:     'var(--text-md)',
              fontWeight:   'var(--weight-bold)',
              color:        'var(--color-text-primary)',
              marginBottom: 'var(--space-1)',
            }}>
              {name}
            </p>
            <p className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
              {user?.email || 'user@email.com'}
            </p>
            <p className="text-tertiary" style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>
              Member since Jan 2025
            </p>
          </div>

          {/* Profile details */}
          <div className="card">
            <p style={{
              fontSize:      'var(--text-xs)',
              fontWeight:    'var(--weight-medium)',
              color:         'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom:  'var(--space-4)',
            }}>
              Profile details
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                { label: 'Target role',  value: bestEntry?.role || 'Not set' },
                { label: 'Resumes',      value: `${history.length} analyzed`  },
                { label: 'Best score',   value: bestScore                      },
                { label: 'Avg JD match', value: `${avgJd}%`                   },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    fontSize:       'var(--text-xs)',
                  }}
                >
                  <span className="text-secondary">{item.label}</span>
                  <span style={{
                    fontWeight: 'var(--weight-medium)',
                    color:      'var(--color-text-primary)',
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
           
            
            <button
              className="btn btn-ghost btn-sm"
              style={{
                width:       '100%',
                color:       'var(--color-danger)',
                borderColor: 'var(--color-danger-bg)',
              }}
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}