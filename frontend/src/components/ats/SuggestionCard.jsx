import toast from 'react-hot-toast'

const PRIORITY_COLOR = {
  High: 'var(--color-danger)',
  Medium: 'var(--color-warning)',
  Low: 'var(--color-text-tertiary)',
}

export default function SuggestionCard({ suggestion }) {
  const section = suggestion.section || 'Resume'
  const priority = suggestion.priority || 'Medium'
  const title = suggestion.title || ''
  const before = (suggestion.before || suggestion.original || '').trim()
  const suggested = (suggestion.after || suggestion.improved || '').trim()

  if (!suggested) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(suggested)
    toast.success('Suggestion copied')
  }

  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-4)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', marginBottom: '2px' }}>
            {section}
          </p>
          {title && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{title}</p>
          )}
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: PRIORITY_COLOR[priority], whiteSpace: 'nowrap' }}>
          {priority}
        </span>
      </div>

      {before && before !== suggested && (
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>
            Current
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {before}
          </p>
        </div>
      )}

      <div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-1)' }}>
          Suggested
        </p>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-primary)',
            margin: 0,
            padding: 'var(--space-3)',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            background: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary-muted)',
            borderRadius: 'var(--radius-md)',
            minHeight: '48px',
          }}
        >
          {suggested}
        </p>
      </div>

      <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy} style={{ alignSelf: 'flex-start' }}>
        Copy suggestion
      </button>
    </div>
  )
}
