// src/pages/InterviewPage.jsx
import { useState, useCallback } from 'react'
import CategoryTabs from '../components/interview/CategoryTabs'
import QuestionCard from '../components/interview/QuestionCard'
import QuestionList from '../components/interview/QuestionList'
import { Skeleton, EmptyState } from '../components/ui'
import toast from 'react-hot-toast'

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
  const [role,      setRole]      = useState('')
  const [category,  setCategory]  = useState('All')
  const [loading,   setLoading]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [questions, setQuestions] = useState([])
  const [current,   setCurrent]   = useState(0)
  const [done,      setDone]      = useState([])
  const [skipped,   setSkipped]   = useState([])

  const buildSet = useCallback((cat) => {
    const pool = cat === 'All'
      ? ALL_QUESTIONS
      : ALL_QUESTIONS.filter(q => q.category === cat)
    setQuestions(shuffle(pool))
    setCurrent(0)
    setDone([])
    setSkipped([])
  }, [])

  function handleCategoryChange(cat) {
    setCategory(cat)
    if (generated) buildSet(cat)
  }

  async function handleGenerate() {
    setLoading(true)
    // replace with interviewService.generate({ role, category }) on Day 5
    await new Promise(r => setTimeout(r, 1000))
    buildSet(category)
    setGenerated(true)
    setLoading(false)
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
      <div style={{
        display:        'flex',
        alignItems:     'flex-start',
        justifyContent: 'space-between',
        flexWrap:       'wrap',
        gap:            'var(--space-4)',
        marginBottom:   'var(--space-6)',
      }}>
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

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
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
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <CategoryTabs active={category} onChange={handleCategoryChange} />
      </div>

      {/* States */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
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

      ) : (
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gap:                 'var(--space-6)',
          alignItems:          'start',
        }}>

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