import { useState } from 'react'
import SuggestionCard from './SuggestionCard'
import toast from 'react-hot-toast'

const FILTERS = ['All', 'Improve', 'Add', 'Remove']

export default function SuggestionsPanel({ suggestions = [] }) {
  const [filter,   setFilter]   = useState('All')
  const [applied,  setApplied]  = useState([])

  const visible = filter === 'All'
    ? suggestions
    : suggestions.filter(s => s.type === filter)

  function handleApply(suggestion) {
    setApplied(prev => [...prev, suggestion.id])
    toast.success(`Suggestion applied — ${suggestion.section}`)
  }

  function handleApplyAll() {
    setApplied(suggestions.map(s => s.id))
    toast.success('All suggestions applied!')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        <p style={{
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          color: 'var(--color-text-primary)'
        }}>
          AI suggestions
          <span style={{
            marginLeft: 'var(--space-2)',
            padding: '1px 8px',
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
          }}>
            {suggestions.length}
          </span>
        </p>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {FILTERS.map(f => (
            <button key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--weight-medium)',
                borderRadius: 'var(--radius-full)',
                border: 'none', cursor: 'pointer',
                background: filter === f
                  ? 'var(--color-primary)'
                  : 'var(--color-primary-subtle)',
                color: filter === f
                  ? '#fff'
                  : 'var(--color-primary)',
                transition: 'background var(--transition-fast)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {visible.map(s => (
        <div key={s.id} style={{
          opacity:    applied.includes(s.id) ? 0.45 : 1,
          transition: 'opacity var(--transition-base)',
        }}>
          <SuggestionCard
            suggestion={s}
            onApply={handleApply}
          />
        </div>
      ))}

      {/* Apply all */}
      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleApplyAll}
        disabled={applied.length === suggestions.length}
      >
        {applied.length === suggestions.length
          ? 'All suggestions applied'
          : `Apply all & download`}
      </button>
    </div>
  )
}