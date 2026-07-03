import { useCVHelpers, hasContent } from './cvHelpers'
import { Mail, Phone, MapPin } from 'lucide-react'
import { sanitizeURL } from '../../../lib/validators'

export default function CreativeTemplate({ content }) {
  const { t, isRTL, formatDate } = useCVHelpers(content)
  const dir = isRTL ? 'rtl' : 'ltr'
  const { personalInfo, summary, experience, education, skills, languages, certifications, projects, sectionOrder } = content

  const renderSection = (sectionId) => {
    if (!hasContent(sectionId, content)) return null
    switch (sectionId) {
      case 'personalInfo': return null
      case 'summary':
        return (
          <section key="summary" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-1 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.summary')}
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed ps-6 whitespace-pre-line">{summary}</p>
          </section>
        )
      case 'experience':
        return (
          <section key="experience" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-3 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.experience')}
            </h2>
            <div className="space-y-3 ps-6">
              {experience.map((exp) => (
                <div key={exp.id} className="relative ps-4 border-s-2 border-purple-200">
                  <div className="absolute -start-[5px] top-1 w-2 h-2 rounded-full bg-purple-500" />
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-gray-800">{exp.position}</h3>
                    <span className="text-xs text-purple-500 font-medium">{formatDate(exp.startDate)} — {exp.current ? t('builder.fields.current') : formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-sm text-purple-600 mb-0.5">{exp.company}</p>
                  {exp.description && <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      case 'education':
        return (
          <section key="education" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-3 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.education')}
            </h2>
            <div className="space-y-2 ps-6">
              {education.map((edu) => (
                <div key={edu.id} className="relative ps-4 border-s-2 border-purple-200">
                  <div className="absolute -start-[5px] top-1 w-2 h-2 rounded-full bg-purple-500" />
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-gray-800">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</h3>
                    <span className="text-xs text-purple-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-sm text-purple-600">{edu.institution}</p>
                </div>
              ))}
            </div>
          </section>
        )
      case 'skills':
        return (
          <section key="skills" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.skills')}
            </h2>
            <div className="flex flex-wrap gap-2 ps-6">
              {skills.map((skill) => (
                <span key={skill.id} className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        )
      case 'languages':
        return (
          <section key="languages" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.languages')}
            </h2>
            <div className="grid grid-cols-2 gap-1 ps-6 text-sm">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between">
                  <span className="text-gray-700">{lang.name}</span>
                  <span className="text-purple-400 text-xs">{t(`builder.levels.${lang.level}`)}</span>
                </div>
              ))}
            </div>
          </section>
        )
      case 'certifications':
        return (
          <section key="certifications" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.certifications')}
            </h2>
            <div className="space-y-1 ps-6">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-sm">
                  <span className="font-medium text-gray-800">{cert.name}</span>
                  <span className="text-purple-500 text-xs"> — {cert.issuer} ({formatDate(cert.date)})</span>
                </div>
              ))}
            </div>
          </section>
        )
      case 'projects':
        return (
          <section key="projects" className="mb-5">
            <h2 className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
              <span className="w-4 h-1 bg-purple-600 rounded-full" />
              {t('builder.sections.projects')}
            </h2>
            <div className="space-y-2 ps-6">
              {projects.map((proj) => (
                <div key={proj.id} className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50">
                  <h3 className="font-semibold text-sm text-gray-800">{proj.name}</h3>
                  {proj.description && <p className="text-xs text-gray-600">{proj.description}</p>}
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.technologies.map((tech, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      default: return null
    }
  }

  return (
    <div dir={dir} className="bg-white text-gray-900 max-w-[800px] mx-auto" style={{ minHeight: '100%' }}>
      <header className="bg-gradient-to-br from-purple-600 to-pink-500 text-white p-8">
        <h1 className="text-3xl font-bold">{personalInfo?.fullName || 'Your Name'}</h1>
        <p className="text-purple-100 font-medium text-lg">{personalInfo?.jobTitle || 'Job Title'}</p>
        <div className="flex flex-wrap gap-4 mt-3 text-sm text-purple-100">
          {personalInfo?.email && <span className="flex items-center gap-1"><Mail size={14} /> {personalInfo.email}</span>}
          {personalInfo?.phone && <span className="flex items-center gap-1"><Phone size={14} /> {personalInfo.phone}</span>}
          {personalInfo?.address && <span className="flex items-center gap-1"><MapPin size={14} /> {personalInfo.address}</span>}
        </div>
        {(personalInfo?.links?.linkedin || personalInfo?.links?.github || personalInfo?.links?.website) && (
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-purple-200">
            {personalInfo?.links?.linkedin && (() => { const u = sanitizeURL(personalInfo.links.linkedin); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a> : null })()}
            {personalInfo?.links?.github && (() => { const u = sanitizeURL(personalInfo.links.github); return u ? <span>· <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a></span> : null })()}
            {personalInfo?.links?.website && (() => { const u = sanitizeURL(personalInfo.links.website); return u ? <span>· <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-white">{personalInfo.links.website}</a></span> : null })()}
          </div>
        )}
      </header>

      <div className="p-8">
        {(sectionOrder || []).map(renderSection)}
      </div>
    </div>
  )
}
