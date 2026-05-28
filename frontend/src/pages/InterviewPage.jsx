// src/pages/InterviewPage.jsx
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import CategoryTabs from '../components/interview/CategoryTabs'
import QuestionCard from '../components/interview/QuestionCard'
import QuestionList from '../components/interview/QuestionList'
import { Skeleton, EmptyState } from '../components/ui'
import toast from 'react-hot-toast'
import resumeService from '../services/resumeService'
import interviewService from '../services/interviewService'

const ALL_QUESTIONS = [
  { id: 1,  category: 'Behavioural', text: 'Tell me about a challenging bug you fixed and how you approached it.',             tip: 'Did you mention: how you found it, tools used, and what you learned?' },
  { id: 2,  category: 'Technical',   text: 'Design a REST API for a resume upload service. What endpoints would you include?',  tip: 'Did you mention: POST /upload, file validation, 400/413/500 error codes?' },
  { id: 3,  category: 'Behavioural', text: 'Where do you see yourself in 5 years?',                                            tip: 'Did you tie it to the role and show growth mindset?' },
  { id: 4,  category: 'Gap-based',   text: 'You lack Docker experience. How would you get up to speed if hired?',              tip: 'Did you mention: a specific learning plan and a project you\'d build?' },
  { id: 5,  category: 'Technical',   text: 'Explain time complexity. Give an example from your own code.',                     tip: 'Did you give a real example with O(n), O(log n), or O(n²)?' },
  { id: 6,  category: 'Behavioural', text: 'Describe a time you disagreed with a teammate. How did you resolve it?',           tip: 'Did you show empathy, communication, and a positive outcome?' },
  { id: 7,  category: 'Technical',   text: 'How does React\'s virtual DOM work and why does it improve performance?',          tip: 'Did you mention diffing, reconciliation, and batching?' },
  { id: 8,  category: 'Gap-based',   text: 'Your resume shows no CI/CD experience. How would you contribute to our pipeline?', tip: 'Did you mention GitHub Actions, Jenkins, or a willingness to learn?' },
  { id: 9,  category: 'Technical',   text: 'What is the difference between SQL and NoSQL? When would you use each?',           tip: 'Did you give a real use-case for each, not just definitions?' },
  { id: 10, category: 'Behavioural', text: 'Tell me about a time you had to learn something new very quickly.',                tip: 'Did you explain what you learned, how fast, and the outcome?' },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function InterviewPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [role,      setRole]      = useState('')
  const [category,  setCategory]  = useState('All')
  const [loading,   setLoading]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [allQuestions, setAllQuestions] = useState([])
  const [questions, setQuestions] = useState([])
  const [done,      setDone]      = useState([])
  const [skipped,   setSkipped]   = useState([])
  const [current,   setCurrent]   = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [showSummary,  setShowSummary]  = useState(false)

  useEffect(() => {
    const seenKey = `seen_questions_${role || 'general'}`
    const seen = localStorage.getItem(seenKey)
    setHistoryCount(seen ? JSON.parse(seen).length : 0)
  }, [role])

  useEffect(() => {
    if (generated && questions.length > 0 && questions[current]) {
      const activeQ = questions[current].text
      const seenKey = `seen_questions_${role || 'general'}`
      const seenRaw = localStorage.getItem(seenKey)
      const seenQuestions = seenRaw ? JSON.parse(seenRaw) : []
      if (!seenQuestions.includes(activeQ)) {
        const updatedSeen = [...seenQuestions, activeQ]
        localStorage.setItem(seenKey, JSON.stringify(updatedSeen))
        setHistoryCount(updatedSeen.length)
      }
    }
  }, [current, questions, generated, role])

  function handleFinish() {
    setShowSummary(true)
  }

  function handleRestartFromSummary() {
    setShowSummary(false)
    setGenerated(false)
    setDone([])
    setSkipped([])
    setCurrent(0)
    setAllQuestions([])
    setQuestions([])
  }

  const buildSet = useCallback((cat, poolToUse = allQuestions) => {
    const pool = cat === 'All'
      ? poolToUse
      : poolToUse.filter(q => q.category === cat)
    setQuestions(shuffle(pool))
    setCurrent(0)
    setDone([])
    setSkipped([])
  }, [allQuestions])

  function handleCategoryChange(cat) {
    if (!token) {
      toast.error("Please log in to use this feature.")
      navigate('/login')
      return
    }
    setCategory(cat)
    if (generated) buildSet(cat, allQuestions)
  }

  async function handleGenerate() {
    if (!token) {
      toast.error("Please log in to start interview prep.")
      navigate('/login')
      return
    }
    setLoading(true)
    try {
      // 1. Resolve Resume Text
      let resumeText = ""
      const resumesRes = await resumeService.getResumes()
      if (resumesRes.success && resumesRes.data && resumesRes.data.length > 0) {
        // Use the latest analyzed resume
        resumeText = resumesRes.data[0].parsedText || ""
      }
      
      // Fallback resume texts based on dropdown role if no resume exists
      if (!resumeText) {
        if (role === 'swe') {
          resumeText = "Software Engineer skilled in React, Node.js, Express, JavaScript, SQL, Git."
        } else if (role === 'da') {
          resumeText = "Data Analyst skilled in SQL, Python, Excel, Tableau, PowerBI."
        } else if (role === 'pm') {
          resumeText = "Product Manager skilled in Agile, Scrum, Product Roadmaps, Jira."
        } else {
          resumeText = "Professional seeking growth and general roles."
        }
      }

      // 2. Call backend generator
      const seenKey = `seen_questions_${role || 'general'}`
      const seenRaw = localStorage.getItem(seenKey)
      const seenQuestions = seenRaw ? JSON.parse(seenRaw) : []

      const res = await interviewService.generateQuestions(
        resumeText, 
        role ? `Target role: ${role}` : "",
        seenQuestions
      )
      if (res.success && res.data) {
        const formatted = []
        let idCounter = 1
        const categories = res.data.categories || {}
        
        Object.entries(categories).forEach(([catKey, list]) => {
          let categoryName = 'Technical'
          if (catKey === 'behavioral' || catKey === 'situational') categoryName = 'Behavioural'
          else if (catKey === 'roleSpecific') categoryName = 'Gap-based'
          
          if (Array.isArray(list)) {
            list.forEach(q => {
              formatted.push({
                id: idCounter++,
                category: categoryName,
                text: q.question,
                tip: q.hint || q.topic || 'No tip available.'
              })
            })
          }
        })

        if (formatted.length === 0) {
          toast.error("No questions were generated. Try again.")
          setLoading(false)
          return
        }

        setAllQuestions(formatted)
        buildSet(category, formatted)
        setGenerated(true)
        toast.success("Interview questions loaded!")
      } else {
        toast.error("Failed to generate custom questions.")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error generating interview questions.")
    } finally {
      setLoading(false)
    }
  }

  function handleNext() {
    setDone(prev => prev.includes(current) ? prev : [...prev, current])
    setCurrent(i => Math.min(i + 1, questions.length - 1))
  }

  function handlePrev() {
    setCurrent(i => Math.max(i - 1, 0))
  }

  function handleSkip() {
    setSkipped(prev => prev.includes(current) ? prev : [...prev, current])
    setCurrent(i => Math.min(i + 1, questions.length - 1))
    toast('Question skipped', { icon: '↪' })
  }

  function handleSelect(i) {
    setCurrent(i)
  }

  const answered = done.length
  const skippedCount = skipped.length
  const left = questions.length - answered - skippedCount

  return (
    <div style={{
      maxWidth: 'var(--container-max)',
      margin:   '0 auto',
      padding:  'var(--space-8) var(--container-pad)',
    }}>

      {/* Header */}
      <div className="interview-header">
        <div>
          <h2 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-2xl)',
            fontWeight:   'var(--weight-bold)',
            marginBottom: 'var(--space-1)',
          }}>
            Interview prep
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            Practice with a timer. Analyze yourself honestly.          </p>
        </div>

        <div className="interview-header-controls">
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{
              height:       40,
              padding:      '0 var(--space-4)',
              fontFamily:   'var(--font-body)',
              fontSize:     'var(--text-sm)',
              color:        'var(--color-text-primary)',
              background:   'var(--color-bg-surface-2)',
              border:       '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              outline:      'none',
            }}
            onMouseDown={(e) => {
              if (!token) {
                e.preventDefault()
                toast.error("Please log in to use this feature.")
                navigate('/login')
              }
            }}
          >
            <option value="">General questions</option>
            <option value="swe">Software Engineer</option>
            <option value="da">Data Analyst</option>
            <option value="pm">Product Manager</option>
          </select>
          <button
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Shuffling…' : generated ? 'Reshuffle' : 'Start practice'}
          </button>
          {generated && !showSummary && (
            <button
              className="btn btn-ghost"
              onClick={handleFinish}
              style={{
                height: 40,
                padding: '0 var(--space-4)',
                fontSize: 'var(--text-sm)',
                borderColor: 'var(--color-success)',
                color: 'var(--color-success)',
              }}
            >
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div className="category-tabs-scroll">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
      </div>

      {/* States */}
      {loading ? (
        <div className="interview-skeleton-grid">
          <Skeleton height="500px" radius="var(--radius-lg)" />
          <Skeleton height="500px" radius="var(--radius-lg)" />
        </div>

      ) : !generated ? (
        <EmptyState
          title="Ready when you are"
          description="Select a role, pick a category, and hit Start practice. Questions will be shuffled randomly."
        />

      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions in this category"
          description="Try All or a different category tab"
        />

      ) : showSummary ? (
        /* ── Interview Summary Card ── */
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
        }}>
          <div className="card" style={{
            border: '2px solid var(--color-primary-muted)',
            textAlign: 'center',
            padding: 'var(--space-8)',
          }}>
            {/* Icon */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--color-success-bg)',
              border: '2px solid var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: 28,
            }}>
              🎯
            </div>

            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-2)',
            }}>
              Session Complete!
            </h3>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
            }}>
              Here's a summary of your interview practice session.
            </p>

            {/* Stats grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
            }}>
              {/* Answered */}
              <div style={{
                background: 'var(--color-success-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-success)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {answered}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-success)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Answered
                </div>
              </div>

              {/* Skipped */}
              <div style={{
                background: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-warning)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {skippedCount}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-warning)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Skipped
                </div>
              </div>

              {/* Left */}
              <div style={{
                background: 'var(--color-bg-surface-2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
                border: '1px solid var(--color-border)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--weight-bold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--space-1)',
                }}>
                  {left}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--weight-medium)',
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  Left
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-tertiary)',
                marginBottom: 'var(--space-2)',
              }}>
                <span>Completion</span>
                <span>{questions.length > 0 ? Math.round((answered / questions.length) * 100) : 0}%</span>
              </div>
              <div className="progress-track" style={{ height: 8 }}>
                <div
                  className="progress-fill success"
                  style={{ width: `${questions.length > 0 ? (answered / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button
                className="btn btn-ghost"
                onClick={handleRestartFromSummary}
              >
                Start New Session
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setShowSummary(false) }}
              >
                Back to Questions
              </button>
            </div>
          </div>
        </div>

      ) : (
        <div className="interview-content-grid">

          {/* LEFT — active question + timer */}
          <QuestionCard
            question={questions[current]}
            index={current}
            total={questions.length}
            onNext={handleNext}
            onPrev={handlePrev}
            onSkip={handleSkip}
          />

          {/* RIGHT — question list */}
          <div>
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   'var(--space-3)',
            }}>
              <p style={{
                fontSize:      'var(--text-xs)',
                fontWeight:    'var(--weight-medium)',
                color:         'var(--color-text-tertiary)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                {answered} answered · {skippedCount} skipped · {left} left
              </p>
              <div style={{ width: 100 }}>
                <div className="progress-track">
                  <div
                    className="progress-fill success"
                    style={{ width: `${(answered / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <QuestionList
              questions={questions}
              currentIndex={current}
              doneIndexes={done}
              skippedIndexes={skipped}
              onSelect={handleSelect}
            />
          </div>
        </div>
      )}
    </div>
  )
}