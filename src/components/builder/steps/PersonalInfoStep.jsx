import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, MapPin, Linkedin, Github, Globe, User, Briefcase, Upload, X, Camera } from 'lucide-react'

export default function PersonalInfoStep({ data, onChange }) {
  const { t } = useTranslation()
  const fileRef = useRef(null)
  const [photoError, setPhotoError] = useState('')

  const update = (field, value) => {
    onChange({ ...data, [field]: value })
  }

  const updateLink = (field, value) => {
    onChange({ ...data, links: { ...data.links, [field]: value } })
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoError('')

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError(t('builder.fields.photo_too_large') || 'Image too large (max 2MB)')
      return
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError(t('builder.fields.photo_invalid') || 'Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      // Resize image to max 300x300
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 300
        let { width, height } = img
        if (width > height) {
          if (width > maxSize) { height = (height * maxSize) / width; width = maxSize }
        } else {
          if (height > maxSize) { width = (width * maxSize) / height; height = maxSize }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        update('photo', resized)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    update('photo', null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Photo Upload */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {data.photo ? (
            <>
              <img
                src={data.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
              />
              <button
                onClick={removePhoto}
                className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center text-gray-300">
              <User size={36} />
            </div>
          )}
        </div>
        <div>
          <label className="label">{t('builder.fields.photo')}</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhoto}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-outline text-sm"
          >
            <Camera size={16} /> {data.photo ? (t('builder.fields.change_photo') || 'Change') : (t('builder.fields.upload_photo') || 'Upload')}
          </button>
          {photoError && <p className="text-red-500 text-xs mt-1">{photoError}</p>}
          <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">{t('builder.fields.full_name')}</label>
          <div className="relative">
            <User size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="text" value={data.fullName || ''} onChange={(e) => update('fullName', e.target.value)} className="input ps-10" maxLength={100} />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.job_title')}</label>
          <div className="relative">
            <Briefcase size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="text" value={data.jobTitle || ''} onChange={(e) => update('jobTitle', e.target.value)} className="input ps-10" maxLength={100} />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.email')}</label>
          <div className="relative">
            <Mail size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="email" value={data.email || ''} onChange={(e) => update('email', e.target.value)} className="input ps-10" maxLength={100} dir="ltr" />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.phone')}</label>
          <div className="relative">
            <Phone size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="tel" value={data.phone || ''} onChange={(e) => update('phone', e.target.value)} className="input ps-10" maxLength={20} dir="ltr" />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('builder.fields.address')}</label>
          <div className="relative">
            <MapPin size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="text" value={data.address || ''} onChange={(e) => update('address', e.target.value)} className="input ps-10" maxLength={200} />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.linkedin')}</label>
          <div className="relative">
            <Linkedin size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="url" value={data.links?.linkedin || ''} onChange={(e) => updateLink('linkedin', e.target.value)} className="input ps-10" maxLength={200} dir="ltr" placeholder="linkedin.com/in/..." />
          </div>
        </div>

        <div>
          <label className="label">{t('builder.fields.github')}</label>
          <div className="relative">
            <Github size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="url" value={data.links?.github || ''} onChange={(e) => updateLink('github', e.target.value)} className="input ps-10" maxLength={200} dir="ltr" placeholder="github.com/..." />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label">{t('builder.fields.website')}</label>
          <div className="relative">
            <Globe size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
            <input type="url" value={data.links?.website || ''} onChange={(e) => updateLink('website', e.target.value)} className="input ps-10" maxLength={200} dir="ltr" placeholder="yoursite.com" />
          </div>
        </div>
      </div>
    </div>
  )
}
