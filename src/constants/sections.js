export const SECTION_TYPES = {
  personalInfo: {
    id: 'personalInfo',
    key: 'personal_info',
    icon: 'User',
    required: true,
    customizable: false,
  },
  summary: {
    id: 'summary',
    key: 'summary',
    icon: 'FileText',
    required: false,
    customizable: true,
  },
  experience: {
    id: 'experience',
    key: 'experience',
    icon: 'Briefcase',
    required: false,
    customizable: true,
  },
  education: {
    id: 'education',
    key: 'education',
    icon: 'GraduationCap',
    required: false,
    customizable: true,
  },
  skills: {
    id: 'skills',
    key: 'skills',
    icon: 'Wrench',
    required: false,
    customizable: true,
  },
  languages: {
    id: 'languages',
    key: 'languages',
    icon: 'Globe',
    required: false,
    customizable: true,
  },
  certifications: {
    id: 'certifications',
    key: 'certifications',
    icon: 'Award',
    required: false,
    customizable: true,
  },
  projects: {
    id: 'projects',
    key: 'projects',
    icon: 'FolderGit2',
    required: false,
    customizable: true,
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

// BUILDER_STEPS is generated from section order at runtime in BuilderPage
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

// Fixed steps that always exist regardless of section order
export const FIXED_STEPS = [
  { id: 'personalInfo', key: 'personal_info' },
  { id: 'sectionOrder', key: 'section_order' },
]
