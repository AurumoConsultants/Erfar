'use client'

import { useState, useMemo } from 'react'

interface NodeRow {
  id: string
  parent_id: string | null
  label: string
  sort_order: number
}

async function api(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error ?? 'Något gick fel.')
  return json
}

function countDescendants(id: string, byParent: Map<string | null, NodeRow[]>): number {
  const children = byParent.get(id) ?? []
  return children.reduce((sum, c) => sum + 1 + countDescendants(c.id, byParent), 0)
}

export default function AdminTaxonomyTree({ initialNodes }: { initialNodes: NodeRow[] }) {
  const [nodes, setNodes] = useState<NodeRow[]>(initialNodes)
  const [error, setError] = useState('')
  const [addingUnder, setAddingUnder] = useState<string | null>(null) // null = not adding a root; 'root' sentinel below
  const [newLabel, setNewLabel] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const byParent = useMemo(() => {
    const map = new Map<string | null, NodeRow[]>()
    for (const n of nodes) {
      const key = n.parent_id
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(n)
    }
    for (const list of map.values()) list.sort((a, b) => a.sort_order - b.sort_order)
    return map
  }, [nodes])

  async function handleAdd(parentId: string | null) {
    const label = newLabel.trim()
    if (!label) return
    setError('')
    try {
      const { node } = await api('/api/admin/taxonomy', {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId, label }),
      })
      setNodes(prev => [...prev, node])
      setNewLabel('')
      setAddingUnder(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel.')
    }
  }

  async function handleRename(id: string) {
    const label = renameValue.trim()
    if (!label) return
    setError('')
    try {
      await api(`/api/admin/taxonomy/${id}`, { method: 'PATCH', body: JSON.stringify({ label }) })
      setNodes(prev => prev.map(n => n.id === id ? { ...n, label } : n))
      setRenamingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel.')
    }
  }

  async function handleDelete(node: NodeRow) {
    const count = countDescendants(node.id, byParent)
    const message = count > 0
      ? `Ta bort "${node.label}" och dess ${count} underliggande taggkategorier? Detta kan inte ångras. Redan skapade taggar på projekt/lärdomar påverkas inte.`
      : `Ta bort "${node.label}"? Detta kan inte ångras.`
    if (!confirm(message)) return
    setBusyId(node.id)
    setError('')
    try {
      await api(`/api/admin/taxonomy/${node.id}`, { method: 'DELETE' })
      const toRemove = new Set([node.id])
      let grew = true
      while (grew) {
        grew = false
        for (const n of nodes) {
          if (n.parent_id && toRemove.has(n.parent_id) && !toRemove.has(n.id)) {
            toRemove.add(n.id)
            grew = true
          }
        }
      }
      setNodes(prev => prev.filter(n => !toRemove.has(n.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleMove(node: NodeRow, direction: -1 | 1) {
    const siblings = byParent.get(node.parent_id) ?? []
    const idx = siblings.findIndex(s => s.id === node.id)
    const swapWith = siblings[idx + direction]
    if (!swapWith) return
    setError('')
    try {
      await Promise.all([
        api(`/api/admin/taxonomy/${node.id}`, { method: 'PATCH', body: JSON.stringify({ sort_order: swapWith.sort_order }) }),
        api(`/api/admin/taxonomy/${swapWith.id}`, { method: 'PATCH', body: JSON.stringify({ sort_order: node.sort_order }) }),
      ])
      setNodes(prev => prev.map(n => {
        if (n.id === node.id) return { ...n, sort_order: swapWith.sort_order }
        if (n.id === swapWith.id) return { ...n, sort_order: node.sort_order }
        return n
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Något gick fel.')
    }
  }

  function renderAddForm(parentId: string | null) {
    const key = parentId ?? 'root'
    if (addingUnder !== key) return null
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          autoFocus
          value={newLabel}
          onChange={e => setNewLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd(parentId) }
            if (e.key === 'Escape') { setAddingUnder(null); setNewLabel('') }
          }}
          placeholder="Namn..."
          className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button type="button" onClick={() => handleAdd(parentId)}
          className="text-xs bg-orange-600 text-white px-2 py-1 rounded-lg hover:bg-orange-700 transition">
          Spara
        </button>
        <button type="button" onClick={() => { setAddingUnder(null); setNewLabel('') }}
          className="text-xs text-gray-400 hover:text-gray-600">
          Avbryt
        </button>
      </div>
    )
  }

  function renderNode(node: NodeRow, depth: number) {
    const children = byParent.get(node.id) ?? []
    const siblings = byParent.get(node.parent_id) ?? []
    const idx = siblings.findIndex(s => s.id === node.id)
    const isLeaf = children.length === 0

    return (
      <li key={node.id} className="mt-1">
        <div className="flex items-center gap-1 group">
          <div className="flex flex-col leading-none">
            <button type="button" disabled={idx === 0} onClick={() => handleMove(node, -1)}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-0 text-xs">▲</button>
            <button type="button" disabled={idx === siblings.length - 1} onClick={() => handleMove(node, 1)}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-0 text-xs">▼</button>
          </div>

          {renamingId === node.id ? (
            <>
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleRename(node.id) }
                  if (e.key === 'Escape') setRenamingId(null)
                }}
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button type="button" onClick={() => handleRename(node.id)} className="text-xs text-orange-700 font-semibold">Spara</button>
              <button type="button" onClick={() => setRenamingId(null)} className="text-xs text-gray-400">Avbryt</button>
            </>
          ) : (
            <>
              <span className={`text-sm ${isLeaf ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>{node.label}</span>
              {isLeaf && <span className="text-xs text-gray-300">(tagg)</span>}
              <button type="button" onClick={() => { setRenamingId(node.id); setRenameValue(node.label) }}
                className="text-xs text-gray-300 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition">
                Byt namn
              </button>
              <button type="button" onClick={() => { setAddingUnder(node.id); setNewLabel('') }}
                className="text-xs text-gray-300 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition">
                + Underkategori
              </button>
              <button type="button" disabled={busyId === node.id} onClick={() => handleDelete(node)}
                className="text-xs text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition disabled:opacity-50">
                Ta bort
              </button>
            </>
          )}
        </div>

        {renderAddForm(node.id)}

        {children.length > 0 && (
          <ul className="pl-6 border-l border-gray-100 ml-2">
            {children.map(c => renderNode(c, depth + 1))}
          </ul>
        )}
      </li>
    )
  }

  const roots = byParent.get(null) ?? []

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <ul>
        {roots.map(r => renderNode(r, 0))}
      </ul>

      <div className="mt-4 pt-4 border-t border-gray-100">
        {addingUnder === 'root' ? (
          renderAddForm(null)
        ) : (
          <button type="button" onClick={() => { setAddingUnder('root'); setNewLabel('') }}
            className="text-sm border border-orange-300 text-orange-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-50 transition">
            + Lägg till huvudkategori
          </button>
        )}
      </div>
    </div>
  )
}
