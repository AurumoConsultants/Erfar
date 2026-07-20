'use client'

import { useState } from 'react'
import { BUILDING_TAG_TAXONOMY } from '@erfar/shared'
import type { TaxonomyNode } from '@erfar/shared'

function tagNameFor(path: TaxonomyNode[], leaf: TaxonomyNode) {
  return `${path[0].label} / ${leaf.label}`
}

export default function TagWizard({
  selected,
  onAdd,
}: {
  selected: string[]
  onAdd: (tagName: string) => void
}) {
  const [path, setPath] = useState<TaxonomyNode[]>([])

  const children = path.length === 0 ? BUILDING_TAG_TAXONOMY : path[path.length - 1].children ?? []

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
          <span key={node.label} className="flex items-center gap-1">
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
          const isLeaf = !node.children || node.children.length === 0
          if (isLeaf) {
            const tagName = tagNameFor(path, node)
            const alreadyAdded = selected.includes(tagName)
            return (
              <button
                key={node.label}
                type="button"
                disabled={alreadyAdded}
                onClick={() => onAdd(tagName)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
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
              key={node.label}
              type="button"
              onClick={() => setPath([...path, node])}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-100 transition"
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
