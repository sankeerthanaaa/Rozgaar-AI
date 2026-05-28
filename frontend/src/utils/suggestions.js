export function capitalizeType(type) {
  const t = String(type || 'Improve').toLowerCase()
  if (t === 'add') return 'Add'
  if (t === 'remove') return 'Remove'
  return 'Improve'
}

export function normalizeSuggestion(s, idx = 0) {
  if (typeof s === 'string') {
    const text = s.trim()
    if (text.length < 12) return null
    return {
      id: idx + 1,
      section: 'Resume',
      type: 'Improve',
      priority: 'Medium',
      title: '',
      before: '',
      after: text,
      original: '',
      improved: text,
    }
  }

  const before = String(s.original || s.before || '').trim()
  const after = String(
    s.improved || s.after || s.text || s.message || s.suggestion || ''
  ).trim()

  if (!after || after.length < 12) return null
  if (before && before === after) return null

  const section = String(s.section || 'Resume').trim() || 'Resume'
  const priority = ['High', 'Medium', 'Low'].includes(s.priority) ? s.priority : 'Medium'

  return {
    id: s.id ?? idx + 1,
    section,
    type: 'Improve',
    priority,
    title: String(s.title || '').trim(),
    before,
    after,
    original: before,
    improved: after,
  }
}

export function extractSuggestionsFromResponse(resume, apiResponse) {
  const raw =
    apiResponse?.suggestions ||
    apiResponse?.analysis?.suggestions ||
    resume?.suggestions ||
    resume?.atsResult?.suggestions ||
    []

  if (!Array.isArray(raw)) return []

  return raw
    .map((s, idx) => normalizeSuggestion(s, idx))
    .filter(Boolean)
    .slice(0, 3)
    .map((s, idx) => ({ ...s, id: idx + 1 }))
}
