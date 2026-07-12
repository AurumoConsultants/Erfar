import Link from 'next/link'
import { LESSON_TYPES, CONSTRUCTION_PHASES } from '@erfar/shared'
import type { Lesson } from '@erfar/shared'

interface LessonCardProps {
  lesson: Lesson
  showProject?: boolean
}

export default function LessonCard({ lesson, showProject }: LessonCardProps) {
  const typeInfo = LESSON_TYPES.find(t => t.value === lesson.type)!
  const phaseInfo = CONSTRUCTION_PHASES.find(p => p.value === lesson.construction_phase)

  return (
    <Link
      href={`/projects/${lesson.project_id}/lessons/${lesson.id}`}
      className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-lg leading-none">{typeInfo.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{lesson.description}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(lesson.created_at).toLocaleDateString('sv-SE')}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {!lesson.reviewed_at && (
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Utkast</span>
        )}
        {showProject && lesson.project && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{lesson.project.name}</span>
        )}
        {phaseInfo && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{phaseInfo.label}</span>
        )}
        {lesson.tags?.map(tag => (
          <span key={tag.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag.name}</span>
        ))}
        {lesson.images && lesson.images.length > 0 && (
          <span className="text-xs text-gray-400">📷 {lesson.images.length}</span>
        )}
      </div>
    </Link>
  )
}
