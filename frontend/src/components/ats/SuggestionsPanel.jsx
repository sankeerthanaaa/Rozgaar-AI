import SuggestionCard from './SuggestionCard'

export default function SuggestionsPanel({ suggestions = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <p style={{
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        color: 'var(--color-text-primary)',
      }}>
        Suggestions
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

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        maxHeight: '70vh',
        overflowY: 'auto',
      }}>
        {suggestions.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              No suggestions available for this analysis.
            </p>
          </div>
        ) : (
          suggestions
            .filter((s) => (s.after || s.improved || '').trim().length >= 12)
            .map((s) => <SuggestionCard key={s.id} suggestion={s} />)
        )}
      </div>
    </div>
  )
}
