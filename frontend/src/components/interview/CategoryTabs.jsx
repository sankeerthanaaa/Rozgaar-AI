const TABS = ['All', 'Technical', 'Behavioural', 'Gap-based']

export default function CategoryTabs({ active, onChange }) {
  return (
    <>
      {TABS.map(tab => (
        <button key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '6px 16px',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            borderRadius: 'var(--radius-full)',
            border: 'none', cursor: 'pointer',
            background: active === tab
              ? 'var(--color-primary)'
              : 'var(--color-primary-subtle)',
            color: active === tab ? '#fff' : 'var(--color-primary)',
            transition: 'background var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
        >
          {tab}
        </button>
      ))}
    </>
  )
}