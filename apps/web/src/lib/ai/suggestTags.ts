// Heuristic "AI" tag suggestion: no external model call, just keyword
// matching against the company's existing tags plus the shared starter
// list. Good enough to save a click for the obvious cases, without an API
// key or per-call cost.
export function suggestTags(text: string, candidates: string[]): string[] {
  const lower = text.toLowerCase()
  const seen = new Set<string>()
  const result: string[] = []
  for (const candidate of candidates) {
    const clean = candidate.trim().toLowerCase()
    if (!clean || seen.has(clean)) continue
    if (lower.includes(clean)) {
      seen.add(clean)
      result.push(clean)
    }
  }
  return result
}
