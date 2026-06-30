export const SECTION_TYPES = {
  personalInfo: {
    id: 'personalInfo',
    key: 'personal_info',
    icon: 'User',
    required: true,
  },
  summary: {
    id: 'summary',
    key: 'summary',
    icon: 'FileText',
    required: true,
  },
  experience: {
    id: 'experience',
    key: 'experience',
    icon: 'Briefcase',
    required: true,
  },
  education: {
    id: 'education',
    key: 'education',
    icon: 'GraduationCap',
    required: true,
  },
  skills: {
    id: 'skills',
    key: 'skills',
    icon: 'Wrench',
    required: true,
  },
  languages: {
    id: 'languages',
    key: 'languages',
    icon: 'Globe',
    required: false,
  },
  certifications: {
    id: 'certifications',
    key: 'certifications',
    icon: 'Award',
    required: false,
  },
  projects: {
    id: 'projects',
    key: 'projects',
    icon: 'FolderGit2',
    required: false,
  },
}

export const DEFAULT_SECTION_ORDER = [
  'personalInfo',
  'summary',
  'experience',
  'education',
  'skills',
  'languages',
  'certifications',
  'projects',
]

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
export const LANGUAGE_LEVELS = ['beginner', 'intermediate', 'advanced', 'fluent', 'native']

export const BUILDER_STEPS = [
  { id: 'personalInfo', key: 'personal_info' },
  { id: 'summary', key: 'summary' },
  { id: 'experience', key: 'experience' },
  { id: 'education', key: 'education' },
  { id: 'skills', key: 'skills' },
  { id: 'languages', key: 'languages' },
  { id: 'certifications', key: 'certifications' },
  { id: 'projects', key: 'projects' },
  { id: 'sectionOrder', key: 'section_order' },
]
