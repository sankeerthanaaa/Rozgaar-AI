import { useState } from 'react'
import SuggestionCard from './SuggestionCard'
import toast from 'react-hot-toast'
import resumeService from '../../services/resumeService'

const FILTERS = ['All', 'Improve', 'Add', 'Remove']

export default function SuggestionsPanel({ suggestions = [], resumeId, fileName }) {
  const [filter,   setFilter]   = useState('All')
  const [applied,  setApplied]  = useState([])
  const [downloading, setDownloading] = useState(false)

  const visible = filter === 'All'
    ? suggestions
    : suggestions.filter(s => s.type === filter)

  function handleApply(suggestion) {
    if (!applied.includes(suggestion.id)) {
      setApplied(prev => [...prev, suggestion.id])
    }
    toast.success(`Suggestion applied — ${suggestion.section}`)
  }

  async function handleApplyAllAndDownload() {
    // 1. Mark all as applied
    const allIds = suggestions.map(s => s.id)
    setApplied(allIds)
    
    if (!resumeId) {
      toast.error('Resume session expired. Please analyze again.')
      return
    }

    setDownloading(true)
    const toastId = toast.loading('Applying suggestions and generating download...')
    
    try {
      // Determine output format from current fileName extension
      let format = 'pdf'
      if (fileName) {
        const ext = fileName.split('.').pop().toLowerCase()
        if (['txt', 'docx'].includes(ext)) {
          format = ext
        }
      }

      // Call API
      const blob = await resumeService.downloadModified(resumeId, allIds, format)
      
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      
      const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "resume"
      link.setAttribute('download', `modified_${baseName}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Download completed successfully!', { id: toastId })
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download modified resume.', { id: toastId })
    } finally {
      setDownloading(false)
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

      {/* Apply all & download */}
      <button
        className="btn btn-primary"
        style={{ width: '100%' }}
        onClick={handleApplyAllAndDownload}
        disabled={downloading}
      >
        {downloading ? 'Downloading...' : 'Apply all & download'}
      </button>
    </div>
  )
}