import { useState } from 'react'
import SuggestionCard from './SuggestionCard'
import toast from 'react-hot-toast'
import resumeService from '../../services/resumeService'

const FILTERS = ['All', 'Improve', 'Add', 'Remove']

export default function SuggestionsPanel({ suggestions = [], resumeId, onOptimizedOutputGenerated }) {
  const [filter, setFilter] = useState('All')
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)

  const visible = filter === 'All'
    ? suggestions
    : suggestions.filter(s => s.type === filter)

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleApplySelected = async () => {
    if (!resumeId) {
      toast.error('Resume session expired. Please analyze again.')
      return
    }
    if (selectedIds.length === 0) {
      toast.error('Please select at least one suggestion using the checkboxes.')
      return
    }

    setLoading(true)
    const toastId = toast.loading('Applying selected suggestions...')
    
    try {
      // Call API with selected suggestion IDs and format "json"
      const res = await resumeService.downloadModified(resumeId, selectedIds, "json")
      
      if (res && res.plainText) {
        toast.success('Suggestions applied! Check the optimized output below.', { id: toastId })
        if (onOptimizedOutputGenerated) {
          onOptimizedOutputGenerated({
            plainText: res.plainText,
            markdown: res.markdown
          })
        }
      } else {
        toast.error('Failed to apply suggestions.', { id: toastId })
      }
    } catch (error) {
      console.error('Apply suggestions error:', error)
      toast.error('Error applying selected suggestions.', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const handleApplyAll = async () => {
    if (!resumeId) {
      toast.error('Resume session expired. Please analyze again.')
      return
    }

    const allIds = suggestions.map(s => s.id)
    setSelectedIds(allIds)

    setLoading(true)
    const toastId = toast.loading('Applying all suggestions...')
    
    try {
      // Call API with all suggestion IDs and format "json"
      const res = await resumeService.downloadModified(resumeId, allIds, "json")
      
      if (res && res.plainText) {
        toast.success('All suggestions applied successfully!', { id: toastId })
        if (onOptimizedOutputGenerated) {
          onOptimizedOutputGenerated({
            plainText: res.plainText,
            markdown: res.markdown
          })
        }
      } else {
        toast.error('Failed to apply all suggestions.', { id: toastId })
      }
    } catch (error) {
      console.error('Apply all error:', error)
      toast.error('Error applying all suggestions.', { id: toastId })
    } finally {
      setLoading(false)
    }
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

      {/* Cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', maxH: '600px', overflowY: 'auto' }}>
        {visible.map(s => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            isSelected={selectedIds.includes(s.id)}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        <button
          className="btn btn-secondary"
          onClick={handleApplySelected}
          disabled={loading}
          style={{ fontSize: 'var(--text-xs)', height: '40px' }}
        >
          {loading ? 'Applying...' : 'Apply Selected Suggestions'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleApplyAll}
          disabled={loading}
          style={{ fontSize: 'var(--text-xs)', height: '40px' }}
        >
          {loading ? 'Applying All...' : 'Apply All Suggestions'}
        </button>
      </div>
    </div>
  )
}