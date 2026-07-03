import { DEFAULT_SECTION_ORDER } from '../constants/sections'

export function createEmptyCVContent(language = 'ar') {
  return {
    cvLanguage: language,
    personalInfo: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      address: '',
      photo: null,
      links: {
        linkedin: '',
        github: '',
        website: '',
      },
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  }
}

export function createEmptyExperience() {
  return {
    id: crypto.randomUUID(),
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  }
}

export function createEmptyEducation() {
  return {
    id: crypto.randomUUID(),
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: '',
  }
}

export function createEmptySkill() {
  return {
    id: crypto.randomUUID(),
    name: '',
    level: 'intermediate',
  }
}

export function createEmptyLanguage() {
  return {
    id: crypto.randomUUID(),
    name: '',
    level: 'intermediate',
  }
}

export function createEmptyCertification() {
  return {
    id: crypto.randomUUID(),
    name: '',
    issuer: '',
    date: '',
    expiryDate: '',
  }
}

export function createEmptyProject() {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    url: '',
    technologies: [],
  }
}
