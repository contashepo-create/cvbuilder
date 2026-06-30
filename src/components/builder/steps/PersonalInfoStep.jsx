import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Linkedin, Github, Globe, User, Briefcase } from 'lucide-react'

export default function PersonalInfoStep({ data, onChange }) {
  const { t } = useTranslation()

  const update = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const updateLink = (field, value) => {
    onChange({ ...data, links: { ...data.links, [field]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('builder.fields.full_name')}</label>
          <div className="relative">
            <User size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={data.fullName || ''}
              onChange={(e) => update('fullName', e.target.value)}
              className="input ps-10"
              maxLength={100}
            />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.job_title')}</label>
          <div className="relative">
            <Briefcase size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={data.jobTitle || ''}
              onChange={(e) => update('jobTitle', e.target.value)}
              className="input ps-10"
              maxLength={100}
            />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => update('email', e.target.value)}
              className="input ps-10"
              maxLength={100}
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.phone')}</label>
          <div className="relative">
            <Phone size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => update('phone', e.target.value)}
              className="input ps-10"
              maxLength={20}
              dir="ltr"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('builder.fields.address')}</label>
          <div className="relative">
            <MapPin size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="text"
              value={data.address || ''}
              onChange={(e) => update('address', e.target.value)}
              className="input ps-10"
              maxLength={200}
            />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.linkedin')}</label>
          <div className="relative">
            <Linkedin size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="url"
              value={data.links?.linkedin || ''}
              onChange={(e) => updateLink('linkedin', e.target.value)}
              className="input ps-10"
              maxLength={200}
              dir="ltr"
              placeholder="linkedin.com/in/..."
            />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.github')}</label>
          <div className="relative">
            <Github size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="url"
              value={data.links?.github || ''}
              onChange={(e) => updateLink('github', e.target.value)}
              className="input ps-10"
              maxLength={200}
              dir="ltr"
              placeholder="github.com/..."
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('builder.fields.website')}</label>
          <div className="relative">
            <Globe size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input
              type="url"
              value={data.links?.website || ''}
              onChange={(e) => updateLink('website', e.target.value)}
              className="input ps-10"
              maxLength={200}
              dir="ltr"
              placeholder="yoursite.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
