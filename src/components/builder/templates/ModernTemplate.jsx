import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Linkedin, Github, Globe } from 'lucide-react'
import { sanitizeURL } from '../../../lib/validators'
import { useCVHelpers } from './cvHelpers'

export default function ModernTemplate({ content }) {
  const { t, isRTL, formatDate } = useCVHelpers(content)
  const dir = isRTL ? 'rtl' : 'ltr'
  const { personalInfo, summary, experience, education, skills, languages, certifications, projects, sectionOrder } = content

  const safeUrl = (url) => sanitizeURL(url)
  const linkData = [
    { url: personalInfo?.links?.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { url: personalInfo?.links?.github, label: 'GitHub', Icon: Github },
    { url: personalInfo?.links?.website, label: personalInfo?.links?.website || 'Website', Icon: Globe },
  ].filter((l) => l.url?.trim())

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'personalInfo':
        return null
      case 'summary':
        return summary?.trim() ? (
          <section key="summary" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-2">
              {t('builder.sections.summary')}
            </h2>
            <p className="text-sm text-gray-700 leading-loose">{summary}</p>
          </section>
        ) : null
      case 'experience':
        return experience?.length > 0 ? (
          <section key="experience" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.experience')}
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm">{exp.position || ''}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(exp.startDate)} — {exp.current ? t('builder.fields.current') : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-primary-700 mb-1">{exp.company}</p>
                  {exp.description && <p className="text-xs text-gray-600 whitespace-pre-line">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        ) : null
      case 'education':
        return education?.length > 0 ? (
          <section key="education" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.education')}
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm">{edu.degree}{edu.field ? ` - ${edu.field}` : ''}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(edu.startDate)} — {formatDate(edu.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-primary-700">{edu.institution}</p>
                  {edu.description && <p className="text-xs text-gray-600">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
        ) : null
      case 'skills':
        return skills?.length > 0 ? (
          <section key="skills" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.skills')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill.id} className="text-xs px-2.5 py-1 rounded-md bg-primary-50 text-primary-700">
                  {skill.name}
                </span>
              ))}
            </div>
          </section>
        ) : null
      case 'languages':
        return languages?.length > 0 ? (
          <section key="languages" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.languages')}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => (
                <div key={lang.id} className="flex justify-between text-sm">
                  <span>{lang.name}</span>
                  <span className="text-gray-500">{t(`builder.levels.${lang.level}`)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null
      case 'certifications':
        return certifications?.length > 0 ? (
          <section key="certifications" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.certifications')}
            </h2>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <div key={cert.id} className="text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">{cert.name}</span>
                    <span className="text-xs text-gray-500">{formatDate(cert.date)}</span>
                  </div>
                  <p className="text-primary-700 text-xs">{cert.issuer}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null
      case 'projects':
        return projects?.length > 0 ? (
          <section key="projects" className="mb-6">
            <h2 className="text-sm font-bold text-primary-600 border-b-2 border-primary-200 pb-1 mb-3">
              {t('builder.sections.projects')}
            </h2>
            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id} className="text-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium">{proj.name}</span>
                    {proj.url && (() => { const safe = safeUrl(proj.url); return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600">{proj.url}</a> : null })()}
                  </div>
                  {proj.description && <p className="text-xs text-gray-600">{proj.description}</p>}
                  {proj.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.technologies.map((tech, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{tech}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null
      default:
        return null
    }
  }

  return (
    <div dir={dir} className="bg-white text-gray-900 p-8 max-w-[800px] mx-auto" style={{ minHeight: '100%' }}>
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-1/3 bg-primary-50 -m-8 p-8 me-8 self-stretch">
          {personalInfo?.photo && (
            <img src={personalInfo.photo} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
          )}
          <div className="mb-6">
            <h2 className="text-xs font-bold text-primary-600 mb-2">
              {t('builder.fields.contact') || 'Contact'}
            </h2>
            <div className="space-y-1.5 text-xs text-gray-600">
              {personalInfo?.email && <div className="flex items-center gap-1.5"><Mail size={12} /> {personalInfo.email}</div>}
              {personalInfo?.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {personalInfo.phone}</div>}
              {personalInfo?.address && <div className="flex items-center gap-1.5"><MapPin size={12} /> {personalInfo.address}</div>}
              {linkData.map((l, i) => {
                const safe = safeUrl(l.url)
                return safe ? (
                  <a key={i} href={safe} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                    <l.Icon size={12} /> {l.label}
                  </a>
                ) : null
              })}
            </div>
          </div>

          {skills?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-primary-600 mb-2">
                {t('builder.sections.skills')}
              </h2>
              <div className="space-y-1.5">
                {skills.map((skill) => (
                  <div key={skill.id} className="text-xs">
                    <div className="flex justify-between mb-0.5">
                      <span>{skill.name}</span>
                    </div>
                    <div className="h-1 bg-primary-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${{ beginner: 25, intermediate: 50, advanced: 75, expert: 100 }[skill.level] || 50}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {languages?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold text-primary-600 mb-2">
                {t('builder.sections.languages')}
              </h2>
              <div className="space-y-1 text-xs">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex justify-between">
                    <span>{lang.name}</span>
                    <span className="text-gray-500">{t(`builder.levels.${lang.level}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-primary-900">{personalInfo?.fullName || 'Your Name'}</h1>
            <p className="text-primary-600 font-medium">{personalInfo?.jobTitle || 'Job Title'}</p>
          </header>

          {(sectionOrder || []).map((sectionId) => {
            if (sectionId === 'skills' || sectionId === 'languages') return null
            return renderSection(sectionId)
          })}
        </div>
      </div>
    </div>
  )
}
