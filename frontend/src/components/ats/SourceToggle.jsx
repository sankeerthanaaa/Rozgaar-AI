// src/components/ats/SourceToggle.jsx
import FileDropzone   from './FileDropzone'
import LinkedInImport from './LinkedInImport'

/**
 * Props:
 *   active          — 'upload' | 'linkedin'
 *   onChange        — (source: string) => void
 *   onFileSelect    — forwarded to FileDropzone
 *   importedProfile — { name, email, ... } | null  forwarded to LinkedInImport
 *   onReconnect     — () => void  forwarded to LinkedInImport
 */
export default function SourceToggle({
  active,
  onChange,
  onFileSelect,
  importedProfile,
  onReconnect,
}) {
  return (
    <div>
      {/* Toggle pills */}
      <div className="toggle-group" style={{ marginBottom: 'var(--space-5)' }}>
        <button
          id="source-toggle-upload"
          className={`toggle-btn ${active === 'upload' ? 'active' : ''}`}
          onClick={() => onChange('upload')}
        >
          Upload resume
        </button>
        <button
          id="source-toggle-linkedin"
          className={`toggle-btn ${active === 'linkedin' ? 'active' : ''}`}
          onClick={() => onChange('linkedin')}
        >
          LinkedIn import
        </button>
      </div>

      {active === 'upload' && (
        <FileDropzone onFileSelect={onFileSelect} />
      )}

      {active === 'linkedin' && (
        <LinkedInImport
          importedProfile={importedProfile}
          onReconnect={onReconnect}
        />
      )}
    </div>
  )
}