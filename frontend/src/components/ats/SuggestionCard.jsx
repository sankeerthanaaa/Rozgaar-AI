import toast from 'react-hot-toast'

const TYPE_STYLES = {
  Improve: { bg: '#FCE4D6', color: '#712B13' },
  Add:     { bg: '#EAF3DE', color: '#27500A' },
  Remove:  { bg: '#FCEBEB', color: '#791F1F' },
}

const PRIORITY_COLOR = {
  High:   'var(--color-danger)',
  Medium: 'var(--color-warning)',
  Low:    'var(--color-text-tertiary)',
}

export default function SuggestionCard({ suggestion, isSelected, onToggleSelect }) {
  const { type, section, priority } = suggestion
  const before = suggestion.original || suggestion.before || ""
  const after = suggestion.improved || suggestion.after || ""
  const typeStyle = TYPE_STYLES[type] || TYPE_STYLES.Improve

  const handleCopyImproved = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(after);
    toast.success("Copied improved text to clipboard!");
  };

  return (
    <div className="card" style={{ 
      padding: 0, 
      overflow: 'hidden', 
      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)', 
      boxShadow: isSelected ? '0 0 0 1px var(--color-primary-subtle)' : 'none', 
      transition: 'all var(--transition-fast)' 
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--color-bg-surface-2)',
        borderBottom: '1px solid var(--color-border-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onToggleSelect(suggestion.id)}
            style={{ 
              width: '18px', 
              height: '18px', 
              cursor: 'pointer',
              accentColor: 'var(--color-primary)'
            }} 
          />
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)',
            background: typeStyle.bg, color: typeStyle.color,
          }}>
            {type}
          </span>
          <span style={{
            fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text-primary)'
          }}>
            {section}
          </span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: PRIORITY_COLOR[priority] }}>
          {priority} priority
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: 'var(--space-4)' }}>
        {before && (
          <>
            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)',
              marginBottom: 'var(--space-1)'
            }}>
              Original text
            </p>
            <p style={{
              fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
              background: 'var(--color-bg-surface-2)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2) var(--space-3)',
              marginBottom: 'var(--space-3)',
              lineHeight: 'var(--line-normal)',
            }}>
              "{before}"
            </p>
          </>
        )}

        <p style={{
          fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)',
          marginBottom: 'var(--space-1)'
        }}>
          {before ? 'Improved version' : 'Suggestion'}
        </p>
        <p style={{
          fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)',
          background: 'var(--color-success-bg)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-2) var(--space-3)',
          marginBottom: 'var(--space-3)',
          lineHeight: 'var(--line-normal)',
        }}>
          {after}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopyImproved}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Improved Version
          </button>
          <button
            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onToggleSelect(suggestion.id)}
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {isSelected ? 'Selected' : 'Select Suggestion'}
          </button>
        </div>
      </div>
    </div>
  )
}