import { useCVHelpers, hasContent } from './cvHelpers'
import { sanitizeURL } from '../../../lib/validators'

export default function ClassicTemplate({ content }) {
  const { t, isRTL, formatDate } = useCVHelpers()
  const dir = isRTL ? 'rtl' : 'ltr'
  const { personalInfo, summary, experience, education, skills, languages, certifications, projects, sectionOrder } = content

  const renderSection = (sectionId) => {
    if (!hasContent(sectionId, content)) return null
    switch (sectionId) {
      case 'personalInfo': return null
      case 'summary':
        return (
          <section key="summary" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-2">{t('builder.sections.summary')}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )
      case 'experience':
        return (
          <section key="experience" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-3">{t('builder.sections.experience')}</h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm">{exp.position || ''} — {exp.company}</h3>
                    <span className="text-xs text-gray-500">{formatDate(exp.startDate)} — {exp.current ? t('builder.fields.current') : formatDate(exp.endDate)}</span>
                  </div>
                  {exp.description && <p className="text-xs text-gray-600 whitespace-pre-line mt-0.5">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      case 'education':
        return (
          <section key="education" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-3">{t('builder.sections.education')}</h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</h3>
                    <span className="text-xs text-gray-500">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-xs text-gray-600">{edu.institution}</p>
                </div>
              ))}
            </div>
          </section>
        )
      case 'skills':
        return (
          <section key="skills" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-2">{t('builder.sections.skills')}</h2>
            <p className="text-sm text-gray-700">{skills.map((s) => s.name).join(' • ')}</p>
          </section>
        )
      case 'languages':
        return (
          <section key="languages" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-2">{t('builder.sections.languages')}</h2>
            <div className="text-sm space-y-0.5">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between max-w-xs">
                  <span>{lang.name}</span><span className="text-gray-500">{t(`builder.levels.${lang.level}`)}</span>
                </div>
              ))}
            </div>
          </section>
        )
      case 'certifications':
        return (
          <section key="certifications" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-2">{t('builder.sections.certifications')}</h2>
            <div className="space-y-1">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-sm flex justify-between">
                  <span><strong>{cert.name}</strong> — {cert.issuer}</span>
                  <span className="text-xs text-gray-500">{formatDate(cert.date)}</span>
                </div>
              ))}
            </div>
          </section>
        )
      case 'projects':
        return (
          <section key="projects" className="mb-5">
            <h2 className="text-sm font-bold uppercase border-b-2 border-gray-800 pb-1 mb-2">{t('builder.sections.projects')}</h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div key={proj.id} className="text-sm">
                  <h3 className="font-semibold">{proj.name}</h3>
                  {proj.description && <p className="text-xs text-gray-600">{proj.description}</p>}
                  {proj.technologies?.length > 0 && <p className="text-xs text-gray-500">{proj.technologies.join(', ')}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      default: return null
    }
  }

  return (
    <div dir={dir} className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto" style={{ minHeight: '100%' }}>
      <header className="text-center mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold">{personalInfo?.fullName || 'Your Name'}</h1>
        <p className="text-gray-600 font-medium">{personalInfo?.jobTitle || 'Job Title'}</p>
        <div className="flex justify-center flex-wrap gap-3 mt-2 text-xs text-gray-500">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.address && <span>• {personalInfo.address}</span>}
        </div>
        {(personalInfo?.links?.linkedin || personalInfo?.links?.github || personalInfo?.links?.website) && (
          <div className="flex justify-center flex-wrap gap-3 mt-1 text-xs text-gray-500">
            {personalInfo?.links?.linkedin && (() => { const u = sanitizeURL(personalInfo.links.linkedin); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">LinkedIn</a> : null })()}
            {personalInfo?.links?.github && (() => { const u = sanitizeURL(personalInfo.links.github); return u ? <span>• <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">GitHub</a></span> : null })()}
            {personalInfo?.links?.website && (() => { const u = sanitizeURL(personalInfo.links.website); return u ? <span>• <a href={u} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600">{personalInfo.links.website}</a></span> : null })()}
          </div>
        )}
      </header>

      {(sectionOrder || []).map(renderSection)}
    </div>
  )
}
