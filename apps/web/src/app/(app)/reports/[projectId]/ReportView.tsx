'use client'

import { LESSON_TYPES } from '@erfar/shared'
import type { Lesson, Project } from '@erfar/shared'

interface ReportViewProps {
  project: Project
  lessons: Lesson[]
}

export default function ReportView({ project, lessons }: ReportViewProps) {
  const challenges = lessons.filter(l => l.type === 'challenge')
  const successes = lessons.filter(l => l.type === 'success')

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(project.name, 14, 18)
    doc.setFontSize(10)
    doc.text(`Sammanfattning: ${successes.length} framgångar, ${challenges.length} utmaningar`, 14, 26)

    ;(doc as any).autoTable({
      startY: 32,
      head: [['Typ', 'Rubrik', 'Beskrivning', 'Taggar', 'Datum']],
      body: lessons.map(l => [
        LESSON_TYPES.find(t => t.value === l.type)?.label ?? l.type,
        l.title,
        l.description ?? '',
        (l.tags ?? []).map(t => t.name).join(', '),
        new Date(l.created_at).toLocaleDateString('sv-SE'),
      ]),
      styles: { fontSize: 8 },
    })

    doc.save(`${project.name}-rapport.pdf`)
  }

  async function exportExcel() {
    const XLSX = await import('xlsx')
    const rows = lessons.map(l => ({
      Typ: LESSON_TYPES.find(t => t.value === l.type)?.label ?? l.type,
      Rubrik: l.title,
      Beskrivning: l.description ?? '',
      Taggar: (l.tags ?? []).map(t => t.name).join(', '),
      Datum: new Date(l.created_at).toLocaleDateString('sv-SE'),
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Lärdomar')
    XLSX.writeFile(book, `${project.name}-rapport.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.location && <p className="text-gray-500 text-sm mt-1">{project.location}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={exportPdf} className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Exportera PDF
          </button>
          <button onClick={exportExcel} className="border border-gray-300 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            Exportera Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">{LESSON_TYPES[1].icon} Framgångar</p>
          <p className="text-3xl font-bold mt-1">{successes.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">{LESSON_TYPES[0].icon} Utmaningar</p>
          <p className="text-3xl font-bold mt-1">{challenges.length}</p>
        </div>
      </div>

      <div className="space-y-2">
        {lessons.map(l => (
          <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span>{LESSON_TYPES.find(t => t.value === l.type)?.icon}</span>
              <p className="font-medium">{l.title}</p>
            </div>
            {l.description && <p className="text-sm text-gray-500 mt-1">{l.description}</p>}
          </div>
        ))}
        {lessons.length === 0 && <p className="text-gray-400 text-sm">Inga lärdomar loggade för detta projekt.</p>}
      </div>
    </div>
  )
}
