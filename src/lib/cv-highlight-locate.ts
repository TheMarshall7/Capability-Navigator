export interface TextRange {
  start: number
  end: number
}

function normalizeQuotes(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, ' ')
}

function collapseWhitespace(s: string): string {
  return normalizeQuotes(s).replace(/\s+/g, ' ').trim()
}

function locateExact(text: string, quote: string): TextRange | null {
  const idx = text.toLowerCase().indexOf(quote.toLowerCase())
  if (idx === -1) return null
  return { start: idx, end: idx + quote.length }
}

function locateByWordSequence(text: string, quote: string): TextRange | null {
  const words = collapseWhitespace(quote).split(' ').filter(w => w.length > 2)
  if (words.length < 2) return null

  const textLower = text.toLowerCase()
  const minWords = Math.max(2, Math.ceil(words.length * 0.5))
  const first = words[0].toLowerCase()

  let searchFrom = 0
  while (searchFrom < text.length) {
    const start = textLower.indexOf(first, searchFrom)
    if (start === -1) break

    let end = start + words[0].length
    let matched = 1

    for (let i = 1; i < words.length; i++) {
      const pattern = words[i].toLowerCase()
      const slice = textLower.slice(end)
      const gap = slice.match(/^\s+/)
      const nextStart = gap ? end + gap[0].length : end
      if (textLower.slice(nextStart, nextStart + pattern.length) === pattern) {
        end = nextStart + pattern.length
        matched++
      } else {
        break
      }
    }

    if (matched >= minWords) {
      return { start, end }
    }
    searchFrom = start + 1
  }

  return null
}

/**
 * Find quote in CV text. Tries exact match, then partial word-sequence match.
 */
export function locateHighlight(text: string, quote: string): TextRange | null {
  const q = quote.trim()
  if (!q || !text) return null

  return locateExact(text, q) || locateByWordSequence(text, q)
}

/** Replace AI quote with the exact CV substring when a match is found. */
export function repairHighlightQuote(cvText: string, quote: string): string {
  const range = locateHighlight(cvText, quote)
  if (!range) return quote.trim()
  return cvText.slice(range.start, range.end)
}
