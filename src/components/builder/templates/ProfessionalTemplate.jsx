import { useCVHelpers, hasContent } from './cvHelpers'
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react'
import { sanitizeURL } from '../../../lib/validators'

export default function ProfessionalTemplate({ content }) {
  const { t, isRTL, formatDate } = useCVHelpers()
  const dir = isRTL ? 'rtl' : 'ltr'
  const { personalInfo, summary, experience, education, skills, languages, certifications, projects, sectionOrder } = content

  const renderMainSection = (sectionId) => {
    if (!hasContent(sectionId, content)) return null
    switch (sectionId) {
      case 'personalInfo': return null
      case 'summary':
        return (
          <section key="summary" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 border-b border-teal-200 pb-1 mb-2">{t('builder.sections.summary')}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )
      case 'experience':
        return (
          <section key="experience" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 border-b border-teal-200 pb-1 mb-3">{t('builder.sections.experience')}</h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-gray-800">{exp.position}</h3>
                    <span className="text-xs text-gray-400">{formatDate(exp.startDate)} — {exp.current ? t('builder.fields.current') : formatDate(exp.endDate)}</span>
                  </div>
                  <p className="text-sm text-teal-700 mb-0.5">{exp.company}</p>
                  {exp.description && <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      case 'education':
        return (
          <section key="education" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 border-b border-teal-200 pb-1 mb-3">{t('builder.sections.education')}</h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-gray-800">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</h3>
                    <span className="text-xs text-gray-400">{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span>
                  </div>
                  <p className="text-sm text-teal-700">{edu.institution}</p>
                </div>
              ))}
            </div>
          </section>
        )
      case 'projects':
        return (
          <section key="projects" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700 border-b border-teal-200 pb-1 mb-3">{t('builder.sections.projects')}</h2>
            <div className="space-y-2">
              {projects.map((proj) => (
                <div key={proj.id} className="text-sm">
                  <h3 className="font-semibold text-gray-800">{proj.name}</h3>
                  {proj.description && <p className="text-xs text-gray-600">{proj.description}</p>}
                  {proj.technologies?.length > 0 && <p className="text-xs text-gray-400">{proj.technologies.join(', ')}</p>}
                </div>
              ))}
            </div>
          </section>
        )
      default: return null
    }
  }

  const renderSidebarSection = (sectionId) => {
    if (!hasContent(sectionId, content)) return null
    switch (sectionId) {
      case 'skills':
        return (
          <div key="skills" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">{t('builder.sections.skills')}</h2>
            <div className="space-y-1.5">
              {skills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-white">{skill.name}</span>
                    <span className="text-teal-200">{t(`builder.levels.${skill.level}`)}</span>
                  </div>
                  <div className="h-1 bg-teal-900 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${{ beginner: 25, intermediate: 50, advanced: 75, expert: 100 }[skill.level] || 50}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case 'languages':
        return (
          <div key="languages" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">{t('builder.sections.languages')}</h2>
            <div className="space-y-1 text-xs">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between">
                  <span className="text-white">{lang.name}</span>
                  <span className="text-teal-200">{t(`builder.levels.${lang.level}`)}</span>
                </div>
              ))}
            </div>
          </div>
        )
      case 'certifications':
        return (
          <div key="certifications" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">{t('builder.sections.certifications')}</h2>
            <div className="space-y-1 text-xs">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <div className="text-white font-medium">{cert.name}</div>
                  <div className="text-teal-200">{cert.issuer} — {formatDate(cert.date)}</div>
                </div>
              ))}
            </div>
          </div>
        )
      default: return null
    }
  }

  return (
    <div dir={dir} className="bg-white text-gray-900 max-w-[800px] mx-auto overflow-hidden" style={{ minHeight: '100%' }}>
      <div className="flex" style={{ minHeight: '100%' }}>
        {/* Sidebar */}
        <aside className="w-1/3 bg-teal-800 p-6 self-stretch">
          {personalInfo?.photo && (
            <img src={personalInfo.photo} alt="" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-teal-400" />
          )}
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-2">{t('builder.fields.contact') || 'Contact'}</h2>
            <div className="space-y-1.5 text-xs text-teal-100">
              {personalInfo?.email && <div className="flex items-center gap-1.5"><Mail size={11} /> {personalInfo.email}</div>}
              {personalInfo?.phone && <div className="flex items-center gap-1.5"><Phone size={11} /> {personalInfo.phone}</div>}
              {personalInfo?.address && <div className="flex items-center gap-1.5"><MapPin size={11} /> {personalInfo.address}</div>}
              {personalInfo?.links?.linkedin && (() => { const u = sanitizeURL(personalInfo.links.linkedin); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-300"><Linkedin size={11} /> LinkedIn</a> : null })()}
              {personalInfo?.links?.github && (() => { const u = sanitizeURL(personalInfo.links.github); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-300"><Github size={11} /> GitHub</a> : null })()}
              {personalInfo?.links?.website && (() => { const u = sanitizeURL(personalInfo.links.website); return u ? <a href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-300"><Globe size={11} /> {personalInfo.links.website}</a> : null })()}
            </div>
          </div>
          {(sectionOrder || []).map(renderSidebarSection)}
        </aside>

        {/* Main */}
        <div className="flex-1 p-6">
          <header className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">{personalInfo?.fullName || 'Your Name'}</h1>
            <p className="text-teal-700 font-medium">{personalInfo?.jobTitle || 'Job Title'}</p>
          </header>
          {(sectionOrder || []).map(renderMainSection)}
        </div>
      </div>
    </div>
  )
}
