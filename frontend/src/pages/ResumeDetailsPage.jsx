// src/pages/ResumeDetailsPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import resumeService from '../services/resumeService'
import ScorePanel from '../components/ats/ScorePanel'
import SuggestionsPanel from '../components/ats/SuggestionsPanel'
import { scoreColor } from '../utils/scoreColor'

export default function ResumeDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true)
        const res = await resumeService.getResumeById(id)
        if (res.success && res.data) {
          setResume(res.data)
        } else {
          setError(res.message || 'Failed to fetch resume details')
        }
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.message || 'Error loading resume details')
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [id])

  if (loading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 'var(--space-6)' }}>
          ← Back to Dashboard
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
          <LoadingSkeleton />
          <LoadingSkeleton />
        </div>
      </div>
    )
  }

  if (error || !resume) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-12)', textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 500, margin: '0 auto', padding: 'var(--space-8)' }}>
          <h3 style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>Error Loading Details</h3>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-6)' }}>{error || 'Resume not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Map database details to ATS Result state object expected by ScorePanel and SuggestionsPanel
  const score = resume.atsScore || 0
  const resultData = resume.atsResult || {}
  const mappedResult = {
    resumeId: resume._id,
    atsScore: score,
    jobRole: resultData.jobRole || 'General',
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
  }

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
      {/* ── Breadcrumb & header ── */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ← Back to Dashboard
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h2 style={{ marginBottom: 'var(--space-1)' }}>Resume Analysis</h2>
            <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
              Analysis details for <strong>{resume.fileName}</strong>
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => window.open(resume.fileUrl, '_blank')}
          >
            📄 View Original Resume
          </button>
        </div>
      </div>

      {/* ── Main report grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-6)',
        alignItems: 'start',
      }}>
        {/* ══ LEFT COLUMN: Scores ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* ATS Score & Breakdown (reused) */}
          <ScorePanel result={mappedResult} />

          {/* Job Description Match score */}
          {resultData.jdMatch && (
            <div className="card">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-text-primary)',
                }}>
                  JD match score
                </p>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: scoreColor(resultData.jdMatch.score || 0),
                }}>
                  {resultData.jdMatch.score || 0}%
                </span>
              </div>

              <div className="progress-track" style={{ marginBottom: 'var(--space-4)' }}>
                <div
                  className={`progress-fill ${
                    (resultData.jdMatch.score || 0) >= 75 ? 'success' :
                    (resultData.jdMatch.score || 0) >= 50 ? 'warning' : ''
                  }`}
                  style={{ width: `${resultData.jdMatch.score || 0}%` }}
                />
              </div>

              <p style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                Keywords present
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}>
                {(resultData.jdMatch.present || []).map(k => (
                  <span key={k} className="badge keyword-pill-present">{k}</span>
                ))}
                {(!resultData.jdMatch.present || resultData.jdMatch.present.length === 0) && (
                  <span className="text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>None</span>
                )}
              </div>

              <p style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-2)',
              }}>
                Missing keywords
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {(resultData.jdMatch.missing || []).map(k => (
                  <span key={k} className="badge keyword-pill-missing">{k}</span>
                ))}
                {(!resultData.jdMatch.missing || resultData.jdMatch.missing.length === 0) && (
                  <span className="text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>None</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT COLUMN: Suggestions ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Suggestions Panel (reused) */}
          <SuggestionsPanel
            suggestions={mappedResult.suggestions}
            resumeId={resume._id}
            fileName={resume.fileName}
          />
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {[240, 160, 100].map(h => (
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
