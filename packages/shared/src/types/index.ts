export type UserRole = 'client' | 'entrepreneur' | 'spectator'
export type ProjectStatus = 'active' | 'completed' | 'archived'
export type LessonType = 'challenge' | 'success'
export type InviteRole = 'entrepreneur' | 'spectator_project' | 'spectator_company'
export type MemberRole = 'entrepreneur' | 'spectator'
export type ProjectCategoryType = 'nybyggnation' | 'renovering' | 'service'
export type ProjectCategorySubtype = 'bostader' | 'kontor' | 'lokaler' | 'ovrigt'
export type ConstructionPhase = 'idea_stage' | 'early_stages' | 'design' | 'execution' | 'management'

export interface Company {
  id: string
  name: string
  org_number: string | null
  created_at: string
}

export interface Profile {
  id: string
  company_id: string | null
  full_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Project {
  id: string
  company_id: string
  name: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  status: ProjectStatus
  construction_phase: ConstructionPhase
  category_type: ProjectCategoryType
  category_subtype: ProjectCategorySubtype
  created_by: string | null
  created_at: string
  updated_at: string
  // joined
  company?: Company
  lesson_count?: number
}

export interface ProjectMember {
  id: string
  project_id: string
  profile_id: string
  role: MemberRole
  created_at: string
  // joined
  profile?: Profile
}

export interface CompanyViewer {
  id: string
  company_id: string
  profile_id: string
  created_at: string
  // joined
  profile?: Profile
}

export interface Invitation {
  id: string
  company_id: string
  project_id: string | null
  email: string
  role: InviteRole
  token: string
  invited_by: string | null
  accepted_at: string | null
  expires_at: string
  created_at: string
  // joined
  project?: Project
}

export interface Tag {
  id: string
  company_id: string
  name: string
  created_at: string
}

export interface Lesson {
  id: string
  project_id: string
  type: LessonType
  title: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
  // joined
  project?: Project
  author?: Profile
  tags?: Tag[]
  images?: LessonImage[]
}

export interface LessonImage {
  id: string
  lesson_id: string
  storage_path: string
  created_at: string
}
