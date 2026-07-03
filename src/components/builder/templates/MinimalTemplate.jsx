import { useCVHelpers, hasContent } from './cvHelpers'
import { sanitizeURL } from '../../../lib/validators'

export default function MinimalTemplate({ content }) {
  const { t, isRTL, formatDate } = useCVHelpers(content)
  const dir = isRTL ? 'rtl' : 'ltr'
  const { personalInfo, summary, experience, education, skills, languages, certifications, projects, sectionOrder } = content

  const renderSection = (sectionId) => {
    if (!hasContent(sectionId, content)) return null
    switch (sectionId) {
      case 'personalInfo': return null
      case 'summary':
        return (
          <section key="summary" className="mb-8">
            <p className="text-sm text-gray-600 leading-relaxed italic">{summary}</p>
          </section>
        )
      case 'experience':
        return (
          <section key="experience" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.experience')}</h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="border-s border-gray-200 ps-4">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-sm">{exp.position}</h3>
                    <span className="text-xs text-gray-400">{formatDate(exp.startDate)} — {exp.current ? t('builder.fields.current') : formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{exp.company}</p>
                  {exp.description && <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      case 'education':
        return (
          <section key="education" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.education')}</h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="border-s border-gray-200 ps-4">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-sm">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</h3>
                    <span className="text-xs text-gray-400">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{edu.institution}</p>
                </div>
              ))}
            </div>
          </section>
        )
      case 'skills':
        return (
          <section key="skills" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.skills')}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
              {skills.map((s, i) => (
                <span key={s.id}>{s.name}{i < skills.length - 1 ? ',' : ''}</span>
              ))}
            </div>
          </section>
        )
      case 'languages':
        return (
          <section key="languages" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.languages')}</h2>
            <div className="text-sm space-y-0.5 text-gray-700">
              {languages.map((lang) => (
                <div key={lang.id}>{lang.name} — <span className="text-gray-400">{t(`builder.levels.${lang.level}`)}</span></div>
              ))}
            </div>
          </section>
        )
      case 'certifications':
        return (
          <section key="certifications" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.certifications')}</h2>
            <div className="space-y-1 text-sm text-gray-700">
              {certifications.map((cert) => (
                <div key={cert.id}>{cert.name} — {cert.issuer} <span className="text-gray-400">({formatDate(cert.date)})</span></div>
              ))}
            </div>
          </section>
        )
      case 'projects':
        return (
          <section key="projects" className="mb-8">
            <h2 className="text-xs text-gray-400 mb-3">{t('builder.sections.projects')}</h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div key={proj.id} className="text-sm">
                  <h3 className="font-medium">{proj.name}</h3>
                  {proj.description && <p className="text-xs text-gray-500">{proj.description}</p>}
                  {proj.technologies?.length > 0 && <p className="text-xs text-gray-400">{proj.technologies.join(' · ')}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      default: return null
    }
  }

  return (
    <div dir={dir} className="bg-white text-gray-900 p-10 max-w-[800px] mx-auto" style={{ minHeight: '100%' }}>
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-light tracking-wide">{personalInfo?.fullName || 'Your Name'}</h1>
        <p className="text-gray-400 text-sm mt-1">{personalInfo?.jobTitle || 'Job Title'}</p>
        <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-3 text-xs text-gray-400">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>· {personalInfo.phone}</span>}
          {personalInfo?.address && <span>· {personalInfo.address}</span>}
          {personalInfo?.links?.linkedin && (() => { const u = sanitizeURL(personalInfo.links.linkedin); return u ? <span>· <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">LinkedIn</a></span> : null })()}
          {personalInfo?.links?.github && (() => { const u = sanitizeURL(personalInfo.links.github); return u ? <span>· <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">GitHub</a></span> : null })()}
          {personalInfo?.links?.website && (() => { const u = sanitizeURL(personalInfo.links.website); return u ? <span>· <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-gray-600">{personalInfo.links.website}</a></span> : null })()}
        </div>
      </header>

      {(sectionOrder || []).map(renderSection)}
    </div>
  )
}
