'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NodeRow {
  id: string
  parent_id: string | null
  label: string
}

function tagNameFor(path: NodeRow[], leaf: NodeRow) {
  return `${path[0].label} / ${leaf.label}`
}

export default function TagWizard({
  selected,
  onAdd,
}: {
  selected: string[]
  onAdd: (tagName: string) => void
}) {
  const supabase = createClient()
  const [nodes, setNodes] = useState<NodeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [path, setPath] = useState<NodeRow[]>([])

  useEffect(() => {
    supabase
      .from('taxonomy_nodes')
      .select('id, parent_id, label')
      .order('sort_order')
      .then(({ data, error: fetchError }) => {
        if (fetchError) { setError(fetchError.message); setLoading(false); return }
        setNodes(data ?? [])
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const byParent = useMemo(() => {
    const map = new Map<string | null, NodeRow[]>()
    for (const n of nodes) {
      const key = n.parent_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(n)
    }
    return map
  }, [nodes])

  if (loading) return <p className="text-sm text-gray-400">Laddar taggbiblioteket...</p>
  if (error) return <p className="text-sm text-red-600">{error}</p>
  if (nodes.length === 0) return <p className="text-sm text-gray-400">Ingen taxonomi definierad än — kontakta en administratör.</p>

  const children = path.length === 0 ? (byParent.get(null) ?? []) : (byParent.get(path[path.length - 1].id) ?? [])

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          type="button"
          onClick={() => setPath([])}
          className={`hover:underline ${path.length === 0 ? 'font-semibold text-gray-900' : 'text-orange-700'}`}
        >
          Vilken del av byggnaden?
        </button>
        {path.map((node, i) => (
          <span key={node.id} className="flex items-center gap-1">
            <span className="text-gray-300">/</span>
            <button
              type="button"
              onClick={() => setPath(path.slice(0, i + 1))}
              className={`hover:underline ${i === path.length - 1 ? 'font-semibold text-gray-900' : 'text-orange-700'}`}
            >
              {node.label}
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {children.map(node => {
          const isLeaf = !byParent.has(node.id)
          if (isLeaf) {
            const tagName = tagNameFor(path, node)
            const alreadyAdded = selected.includes(tagName)
            return (
              <button
                key={node.id}
                type="button"
                disabled={alreadyAdded}
                onClick={() => onAdd(tagName)}
                className={`px-3 py-2.5 min-h-11 rounded-lg text-sm font-semibold border transition ${
                  alreadyAdded
                    ? 'bg-orange-50 text-orange-400 border-orange-200 cursor-default'
                    : 'border-gray-200 text-gray-700 hover:bg-white hover:border-orange-300'
                }`}
              >
                {node.label} {alreadyAdded ? '✓' : '+'}
              </button>
            )
          }
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setPath([...path, node])}
              className="px-3 py-2.5 min-h-11 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              {node.label} ›
            </button>
          )
        })}
      </div>

      {path.length > 0 && (
        <button
          type="button"
          onClick={() => setPath(path.slice(0, -1))}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← Tillbaka
        </button>
      )}
    </div>
  )
}
