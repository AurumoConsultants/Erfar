'use client'

interface TreeGroup {
  group: string
  leaves: { full: string; label: string }[]
}

function groupTags(tags: string[]): TreeGroup[] {
  const byGroup = new Map<string, { full: string; label: string }[]>()
  for (const tag of tags) {
    const sepIdx = tag.indexOf(' / ')
    const group = sepIdx === -1 ? 'Övrigt' : tag.slice(0, sepIdx)
    const label = sepIdx === -1 ? tag : tag.slice(sepIdx + 3)
    if (!byGroup.has(group)) byGroup.set(group, [])
    byGroup.get(group)!.push({ full: tag, label })
  }
  return Array.from(byGroup.entries()).map(([group, leaves]) => ({ group, leaves }))
}

export default function TagTree({
  tags,
  onRemove,
}: {
  tags: string[]
  onRemove: (tagName: string) => void
}) {
  const groups = groupTags(tags)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 lg:sticky lg:top-4">
      <h3 className="font-semibold text-sm mb-1">Valda taggar</h3>
      <p className="text-xs text-gray-400 mb-3">
        {tags.length === 0
          ? 'Inga taggar valda än — bygg upp en balanserad och detaljerad beskrivning av projektet.'
          : `${tags.length} tagg${tags.length === 1 ? '' : 'ar'} valda`}
      </p>

      {groups.length === 0 && (
        <div className="text-sm text-gray-300 italic">Trädet fylls på här allt eftersom du väljer taggar.</div>
      )}

      <div className="space-y-3">
        {groups.map(({ group, leaves }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{group}</p>
            <ul className="space-y-1 pl-3 border-l-2 border-gray-100">
              {leaves.map(leaf => (
                <li key={leaf.full} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                  <span>{leaf.label}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(leaf.full)}
                    className="text-gray-300 hover:text-red-500 leading-none"
                    aria-label={`Ta bort ${leaf.label}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
