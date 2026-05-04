import { YoutubeTranscript } from 'youtube-transcript'

const MAX_TRANSCRIPT_LENGTH = 8000

/**
 * Extract YouTube Video ID from various URL formats.
 * Returns empty string if not a valid YouTube URL.
 */
const extractVideoId = (url = '') => {
  const normalized = String(url).trim()
  if (!normalized) return ''

  // Bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(normalized)) {
    return normalized
  }

  try {
    const parsed = new URL(normalized)
    const host = parsed.hostname.replace('www.', '')

    if (['youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      return (
        parsed.searchParams.get('v')
        || parsed.pathname.split('/').filter(Boolean).pop()
        || ''
      )
    }

    if (['youtu.be', 'youtube-nocookie.com'].includes(host)) {
      return parsed.pathname.split('/').filter(Boolean)[0] || ''
    }
  } catch {
    return normalized.split('/').pop()?.split('?')[0] || ''
  }

  return ''
}

/**
 * Fetch YouTube transcript for a given video URL.
 * Returns plain text transcript or empty string on failure.
 */
export const fetchYouTubeTranscript = async (videoUrl) => {
  try {
    const videoId = extractVideoId(videoUrl)
    if (!videoId) return ''

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'vi'
    }).catch(() =>
      // Fallback to any available language
      YoutubeTranscript.fetchTranscript(videoId)
    )

    if (!Array.isArray(transcriptItems) || transcriptItems.length === 0) {
      return ''
    }

    const fullText = transcriptItems
      .map(item => item.text || '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Truncate to max length to avoid excessive DB storage
    if (fullText.length > MAX_TRANSCRIPT_LENGTH) {
      return fullText.slice(0, MAX_TRANSCRIPT_LENGTH) + '...'
    }

    return fullText
  } catch (error) {
    console.warn(`[TranscriptHelper] Could not fetch transcript for ${videoUrl}:`, error.message)
    return ''
  }
}

/**
 * Process all lectures in a course content array and populate lectureContent.
 * Mutates the courseContent array in-place.
 * Returns the number of lectures that were successfully populated.
 */
export const populateTranscripts = async (courseContent = []) => {
  let populated = 0

  for (const chapter of courseContent) {
    if (!Array.isArray(chapter.chapterContent)) continue

    for (const lecture of chapter.chapterContent) {
      // Skip if already has content
      if (lecture.lectureContent && lecture.lectureContent.trim().length > 0) continue
      if (!lecture.lectureUrl) continue

      const transcript = await fetchYouTubeTranscript(lecture.lectureUrl)
      if (transcript) {
        lecture.lectureContent = transcript
        populated += 1
      }
    }
  }

  return populated
}
