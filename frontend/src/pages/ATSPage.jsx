// src/pages/ATSPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate }      from 'react-router'
import { useAuth }          from '../context/AuthContext'
import toast                from 'react-hot-toast'
import SourceToggle         from '../components/ats/SourceToggle'
import ScorePanel           from '../components/ats/ScorePanel'
import SuggestionsPanel     from '../components/ats/SuggestionsPanel'
import resumeService        from '../services/resumeService'

const MOCK_RESULT = {
  atsScore: 78,
  jobRole:  'Software Engineer',
  breakdown: [
    { label: 'Keyword match',        value: 82 },
    { label: 'Section completeness', value: 90 },
    { label: 'Formatting score',     value: 65 },
  ],
  keywords: {
    present: ['React', 'Node.js', 'TypeScript', 'REST API'],
    missing: ['Docker', 'Kubernetes', 'CI/CD'],
  },
  jdMatch: {
    score:   74,
    present: ['React', 'Node.js', 'REST API', 'TypeScript'],
    missing: ['Docker', 'Kubernetes', 'GraphQL'],
  },
  suggestions: [
    {
      id: 1, section: 'Experience', type: 'Improve', priority: 'High',
      before: 'Worked on various backend features',
      after:  'Engineered 4 REST API features using Node.js, reducing response time by 35%',
    },
    {
      id: 2, section: 'Skills', type: 'Add', priority: 'Medium',
      before: null,
      after:  'Add Docker, Kubernetes, CI/CD to your skills section',
    },
    {
      id: 3, section: 'Summary', type: 'Improve', priority: 'Low',
      before: 'Experienced developer looking for opportunities',
      after:  'Full-stack engineer with 3 years building scalable web apps using React and Node.js',
    },
  ],
}

const ROLES = [
  'Software Engineer',    'Frontend Developer',
  'Backend Developer',    'Data Analyst',
  'Data Scientist',       'Product Manager',
  'UX Designer',          'DevOps Engineer',
  'Full Stack Developer', 'Others',
]

// centered toast helper — reusable across all actions
function authToast(message, icon = '🔒') {
  toast(message, {
    icon,
    position: 'top-center',
    duration: 1500,
    style: {
      fontFamily:   'var(--font-body)',
      fontSize:     'var(--text-sm)',
      borderRadius: 'var(--radius-md)',
      border:       '1px solid var(--color-primary-muted)',
      color:        'var(--color-primary-dark)',
      background:   'var(--color-primary-subtle)',
      padding:      'var(--space-3) var(--space-5)',
    },
  })
}

function uploadToast() {
  toast.error('Upload your resume first', {
    icon: '📄',
    position: 'top-center',
    duration: 2000,
    style: {
      fontFamily:   'var(--font-body)',
      fontSize:     'var(--text-sm)',
      borderRadius: 'var(--radius-md)',
      border:       '1px solid var(--color-border)',
      color:        'var(--color-text-primary)',
      background:   'var(--color-bg-surface)',
      padding:      'var(--space-3) var(--space-5)',
    },
  })
}

export default function ATSPage() {
  const { token } = useAuth()
  const navigate  = useNavigate()

  const [source,          setSource]          = useState('upload')
  const [file,            setFile]            = useState(null)
  const [fileName,        setFileName]        = useState(null)
  const [role,            setRole]            = useState('')
  const [customRole,      setCustomRole]      = useState('')
  const [jdText,          setJdText]          = useState('')
  const [linkedInUrl,     setLinkedInUrl]     = useState('')
  const [loading,         setLoading]         = useState(false)
  const [result,          setResult]          = useState(null)
  const [linkedInProfile, setLinkedInProfile] = useState(null) // set after OAuth callback
  const [linkedinAnalyzed,setLinkedinAnalyzed]= useState(false) // true once user clicks Analyze on LinkedIn tab

  const activeRole = role === 'Others' ? customRole : role

  // Pick up LinkedIn profile data stored by LinkedInCallbackPage after OAuth
  useEffect(() => {
    const raw = sessionStorage.getItem('linkedin_resume_data')
    if (!raw) return
    sessionStorage.removeItem('linkedin_resume_data')
    try {
      const resumeData = JSON.parse(raw)
      setSource('linkedin')

      // Bug 2 fix: the backend returns a Resume DB doc.
      // The real name/email live under parsedData, not at the top level.
      // Normalize into a flat shape so LinkedInImport always has the right fields.
      const name =
        resumeData.parsedData?.name ||
        resumeData.name            ||
        resumeData.given_name      ||
        (resumeData.parsedData?.email ? resumeData.parsedData.email.split('@')[0] : null) ||
        'LinkedIn User'
      const email =
        resumeData.parsedData?.email ||
        resumeData.email             ||
        ''

      setLinkedInProfile({ name, email })   // show success card with real name
      setResultFromResume(resumeData)
    } catch (e) {
      console.warn('[ATSPage] Could not parse linkedin_resume_data', e)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Clear the imported profile so the user can reconnect with a different account
  function handleLinkedInReconnect() {
    setLinkedInProfile(null)
    setResult(null)
    setLinkedinAnalyzed(false)
  }

  // Analyze button handler for the LinkedIn tab
  function handleLinkedInAnalyze() {
    if (!requireAuth()) return
    if (!linkedInProfile) {
      // User hasn't connected LinkedIn yet — prompt them
      toast('Connect your LinkedIn account first to analyze your profile.', {
        icon: '🔗',
        position: 'top-center',
        duration: 3000,
        style: {
          fontFamily:   'var(--font-body)',
          fontSize:     'var(--text-sm)',
          borderRadius: 'var(--radius-md)',
          border:       '1px solid var(--color-border)',
          color:        'var(--color-text-primary)',
          background:   'var(--color-bg-surface)',
          padding:      'var(--space-3) var(--space-5)',
        },
      })
      return
    }
    // Profile already imported + analysis already ran on backend during import.
    // Just reveal the results panel.
    setLinkedinAnalyzed(true)
  }

  // redirect immediately — no delay
  function redirectToLogin() {
    navigate('/login', { replace: true })
  }

  function requireAuth() {
    if (!token) {
      authToast('Log in to use this feature')
      redirectToLogin()
      return false
    }
    return true
  }

  // ── Upload zone handlers ──────────────────────────────
  function handleDrop(e) {
    e.preventDefault()
    if (!requireAuth()) return
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDropzoneClick() {
    if (!requireAuth()) return
    document.getElementById('resume-file-input').click()
  }

  function handleFileInputChange(e) {
    const f = e.target.files[0]
    if (f) processFile(f)
  }

  function processFile(f) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    const ext = f.name.split('.').pop().toLowerCase()
    if (!allowed.includes(f.type) && !['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
      toast.error('Only PDF, DOC/DOCX, or TXT files allowed', {
        position: 'top-center',
        style: {
          fontFamily:   'var(--font-body)',
          fontSize:     'var(--text-sm)',
          borderRadius: 'var(--radius-md)',
          background:   'var(--color-bg-surface)',
          color:        'var(--color-text-primary)',
          border:       '1px solid var(--color-border)',
        },
      })
      return
    }
    setFile(f)
    setFileName(f.name)
  }

  // ── LinkedIn import handlers ──────────────────────────
  function handleLinkedInUrlChange(val) {
    setLinkedInUrl(val)
  }

  async function handleLinkedInImport() {
    if (!requireAuth()) return
    if (!linkedInUrl.trim()) {
      toast.error('Please enter a LinkedIn profile URL first')
      return
    }
    setLoading(true)
    try {
      const res = await resumeService.importLinkedIn(linkedInUrl, jdText, activeRole)
      if (res.success && res.data) {
        toast.success("LinkedIn profile imported successfully!")
        setResultFromResume(res.data)
      } else {
        toast.error("Failed to import LinkedIn profile")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error importing LinkedIn profile")
    } finally {
      setLoading(false)
    }
  }

  // Helper to map DB resume to ATS Result state
  function setResultFromResume(resume) {
    const score = resume.atsScore || 0
    const resultData = resume.atsResult || {}
    
    setResult({
      resumeId: resume._id,
      atsScore: score,
      jobRole: resultData.jobRole || activeRole || 'General',
      breakdown: resultData.breakdown || [
        { label: 'Keyword match', value: score },
        { label: 'Section completeness', value: 80 },
        { label: 'Formatting score', value: 80 },
      ],
      keywords: resultData.keywords || {
        present: resultData.jdMatch?.present || [],
        missing: resultData.jdMatch?.missing || [],
      },
      jdMatch: resultData.jdMatch || {
        score: score,
        present: resultData.jdMatch?.present || [],
        missing: resultData.jdMatch?.missing || [],
      },
      suggestions: (resume.suggestions || []).map((s, idx) => {
        if (typeof s === 'string') {
          return {
            id: idx + 1,
            section: 'Resume',
            type: 'Improve',
            priority: 'Medium',
            before: null,
            after: s
          }
        }
        return s
      })
    })
  }

  // ── Role / JD handlers ───────────────────────────────
  function handleRoleChange(val) {
    setRole(val)
    setCustomRole('')
  }

  // ── Custom role and JD handlers ───────────────────────
  function handleCustomRoleChange(val) {
    setCustomRole(val)
  }

  function handleJdChange(val) {
    setJdText(val)
  }

  function handleSourceChange(val) {
    setSource(val)
    // Reset ALL tab state when switching so results never bleed across tabs.
    setFile(null)
    setFileName(null)
    setResult(null)
    setLoading(false)
    setLinkedinAnalyzed(false)
  }

  // ── Analyze ──────────────────────────────────────────
  async function handleAnalyze() {
    if (!requireAuth()) return

    if (!file && source === 'upload') {
      uploadToast()
      return
    }

    setLoading(true)
    try {
      let res
      if (source === 'upload') {
        res = await resumeService.uploadResume(file, jdText, activeRole ? [activeRole] : [])
      } else {
        if (!file) {
          uploadToast()
          setLoading(false)
          return
        }
        res = await resumeService.uploadResume(file, jdText, activeRole ? [activeRole] : [])
      }

      if (res.success && res.data) {
        toast.success("Analysis complete!")
        setResultFromResume(res.data)
      } else {
        toast.error("Failed to analyze resume.")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Error analyzing resume. Please make sure the file is valid.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ marginBottom: 'var(--space-1)' }}>
          Check your ATS score
        </h2>
        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
          Upload your resume, add a job description, and get instant AI analysis
        </p>
      </div>

      {/* ── Source toggle + inline input panel ── */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <SourceToggle
          active={source}
          onChange={handleSourceChange}
          onFileSelect={f => {
            if (!requireAuth()) return
            processFile(f)
          }}
          importedProfile={linkedInProfile}
          onReconnect={handleLinkedInReconnect}
        />
      </div>

      {/* ── Role + JD + Analyze card — upload tab only ── */}
      {source === 'upload' && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>

          {/* Target role row */}
          <div style={{
            display:      'flex',
            alignItems:   'center',
            flexWrap:     'wrap',
            gap:          'var(--space-3)',
            marginBottom: 'var(--space-5)',
          }}>
            <label style={{
              fontSize:   'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color:      'var(--color-text-secondary)',
              whiteSpace: 'nowrap',
            }}>
              Target role
            </label>

            <select
              value={role}
              onChange={e => handleRoleChange(e.target.value)}
              className="input"
              style={{ width: 220, height: 44, cursor: 'pointer' }}
            >
              <option value="">Select a role</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {role === 'Others' && (
              <input
                className="input"
                style={{ width: 220 }}
                placeholder="Type your job role..."
                value={customRole}
                onChange={e => handleCustomRoleChange(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* Divider */}
          <div style={{
            height:       1,
            background:   'var(--color-border-surface)',
            marginBottom: 'var(--space-5)',
          }} />

          {/* Job description */}
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{
              display:      'block',
              fontSize:     'var(--text-sm)',
              fontWeight:   'var(--weight-medium)',
              color:        'var(--color-text-secondary)',
              marginBottom: 'var(--space-2)',
            }}>
              Job description
              <span
                className="text-tertiary"
                style={{
                  fontSize:   'var(--text-xs)',
                  fontWeight: 'var(--weight-regular)',
                  marginLeft: 'var(--space-2)',
                }}
              >
                optional — paste the JD to get a match score
              </span>
            </label>

            <textarea
              className="input textarea"
              rows={5}
              placeholder="Paste the full job description here. We'll compare it against your resume and show you exactly which keywords you're missing..."
              value={jdText}
              onChange={e => handleJdChange(e.target.value)}
            />

            {jdText.trim().length > 0 && (
              <p className="text-tertiary" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
                {jdText.trim().split(/\s+/).length} words · JD match will run automatically
              </p>
            )}
          </div>

          {/* Analyze button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? 'Analyzing…' : 'Analyze resume'}
            </button>
          </div>
        </div>
      )}

      {/* ── LinkedIn Analyze button — linkedin tab only ── */}
      {source === 'linkedin' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-8)' }}>
          <button
            id="linkedin-analyze-btn"
            className="btn btn-primary"
            onClick={handleLinkedInAnalyze}
            disabled={loading}
          >
            {linkedInProfile ? 'View analysis' : 'Analyze profile'}
          </button>
        </div>
      )}

      {/* ── Results ── */}
      {/* Upload tab: show when loading or result exists */}
      {/* LinkedIn tab: show only after user explicitly clicks Analyze */}
      {((source === 'upload' && (loading || result)) ||
        (source === 'linkedin' && linkedinAnalyzed && result)) && (
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 'var(--space-6)',
          alignItems:          'start',
        }}>

          {/* LEFT — score + JD match */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {loading ? <LoadingSkeleton /> : (
              <>
                <ScorePanel result={result} />

                {jdText.trim().length > 0 && result.jdMatch && (
                  <div className="card">

                    <div style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'space-between',
                      marginBottom:   'var(--space-4)',
                    }}>
                      <p style={{
                        fontSize:   'var(--text-sm)',
                        fontWeight: 'var(--weight-medium)',
                        color:      'var(--color-text-primary)',
                      }}>
                        JD match score
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-display)',
                        fontSize:   'var(--text-xl)',
                        fontWeight: 'var(--weight-bold)',
                        color:      result.jdMatch.score >= 75
                          ? 'var(--color-success)'
                          : result.jdMatch.score >= 50
                          ? 'var(--color-warning)'
                          : 'var(--color-danger)',
                      }}>
                        {result.jdMatch.score}%
                      </span>
                    </div>

                    <div className="progress-track" style={{ marginBottom: 'var(--space-4)' }}>
                      <div
                        className={`progress-fill ${
                          result.jdMatch.score >= 75 ? 'success' :
                          result.jdMatch.score >= 50 ? 'warning' : ''
                        }`}
                        style={{ width: `${result.jdMatch.score}%` }}
                      />
                    </div>

                    <p style={{
                      fontSize:     'var(--text-xs)',
                      fontWeight:   'var(--weight-medium)',
                      color:        'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      Keywords present
                    </p>
                    <div style={{
                      display:      'flex',
                      flexWrap:     'wrap',
                      gap:          'var(--space-2)',
                      marginBottom: 'var(--space-4)',
                    }}>
                      {result.jdMatch.present.map(k => (
                        <span key={k} className="badge keyword-pill-present">{k}</span>
                      ))}
                    </div>

                    <p style={{
                      fontSize:     'var(--text-xs)',
                      fontWeight:   'var(--weight-medium)',
                      color:        'var(--color-text-primary)',
                      marginBottom: 'var(--space-2)',
                    }}>
                      Missing keywords
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {result.jdMatch.missing.map(k => (
                        <span key={k} className="badge keyword-pill-missing">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT — suggestions */}
          <div>
            {loading
              ? <LoadingSkeleton />
              : <SuggestionsPanel 
                  suggestions={result.suggestions} 
                  resumeId={result.resumeId} 
                  fileName={fileName} 
                />
            }
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {[200, 140, 100].map(h => (
        <div key={h} style={{
          height:         h,
          borderRadius:   'var(--radius-lg)',
          background:     'linear-gradient(90deg, var(--color-accent-light) 25%, var(--color-primary-subtle) 50%, var(--color-accent-light) 75%)',
          backgroundSize: '200% 100%',
          animation:      'shimmer 1.4s infinite',
        }} />
      ))}
    </div>
  )
}