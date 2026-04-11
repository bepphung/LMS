const escapeHtml = (text = '') => {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const formatInline = (text = '') => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export const formatAiTextToHtml = (content = '') => {
  const raw = String(content || '').replace(/\r\n/g, '\n')
  const lines = raw.split('\n')

  const htmlParts = []
  let inUnorderedList = false
  let inOrderedList = false
  let inCodeBlock = false
  let codeLines = []

  const closeLists = () => {
    if (inUnorderedList) {
      htmlParts.push('</ul>')
      inUnorderedList = false
    }
    if (inOrderedList) {
      htmlParts.push('</ol>')
      inOrderedList = false
    }
  }

  const flushCodeBlock = () => {
    if (!inCodeBlock) return
    htmlParts.push(`<pre><code>${codeLines.join('\n')}</code></pre>`)
    inCodeBlock = false
    codeLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('```')) {
      closeLists()
      if (inCodeBlock) {
        flushCodeBlock()
      } else {
        inCodeBlock = true
        codeLines = []
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(escapeHtml(line))
      continue
    }

    if (!trimmed) {
      closeLists()
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      closeLists()
      const level = headingMatch[1].length
      const headingText = formatInline(escapeHtml(headingMatch[2]))
      htmlParts.push(`<h${level}>${headingText}</h${level}>`)
      continue
    }

    const unorderedMatch = trimmed.match(/^[-*•]\s+(.+)$/)
    if (unorderedMatch) {
      if (!inUnorderedList) {
        if (inOrderedList) {
          htmlParts.push('</ol>')
          inOrderedList = false
        }
        htmlParts.push('<ul>')
        inUnorderedList = true
      }
      htmlParts.push(`<li>${formatInline(escapeHtml(unorderedMatch[1]))}</li>`)
      continue
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/)
    if (orderedMatch) {
      if (!inOrderedList) {
        if (inUnorderedList) {
          htmlParts.push('</ul>')
          inUnorderedList = false
        }
        htmlParts.push('<ol>')
        inOrderedList = true
      }
      htmlParts.push(`<li>${formatInline(escapeHtml(orderedMatch[1]))}</li>`)
      continue
    }

    closeLists()
    htmlParts.push(`<p>${formatInline(escapeHtml(trimmed))}</p>`)
  }

  closeLists()
  if (inCodeBlock) {
    flushCodeBlock()
  }

  return htmlParts.join('')
}
