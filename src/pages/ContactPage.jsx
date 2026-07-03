import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useAdStore } from '../store/adStore'
import { Send, MessageCircle, AlertCircle, Check, Mail, Megaphone, Lightbulb } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const { sendMessage, contactLinks, fetchContactLinks } = useAdStore()
  const isAr = i18n.language === 'ar'

  const [form, setForm] = useState({
    type: 'complaint',
    subject: '',
    message: '',
    email: user?.email || '',
    name: profile?.full_name || '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const activeLinks = (contactLinks || []).filter(l => l.is_active)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.subject.trim() || !form.message.trim()) {
      setError(isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
      return
    }
    setLoading(true)
    try {
      const typeLabel = form.type === 'complaint'
        ? (isAr ? 'شكوى' : 'Complaint')
        : (isAr ? 'اقتراح' : 'Suggestion')

      await sendMessage({
        user_id: user?.id || null,
        user_email: form.email || user?.email || 'guest@anonymous',
        user_name: form.name || profile?.full_name || (isAr ? 'زائر' : 'Visitor'),
        subject: `[${typeLabel}] ${form.subject.slice(0, 150)}`,
        message: form.message.slice(0, 2000),
      })
      setSuccess(true)
      setForm({ ...form, subject: '', message: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-center">
        {isAr ? 'الشكاوى والمقترحات' : 'Complaints & Suggestions'}
      </h1>
      <p className="text-center text-gray-500 mb-6 text-sm">
        {isAr ? 'نرحب بشكاواكم ومقترحاتكم — يمكنكم الإرسال بدون تسجيل دخول' : 'We welcome your feedback — no login required'}
      </p>

      {/* Quick contact buttons */}
      {activeLinks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {activeLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: link.color + '20', color: link.color }}>
                <span className="text-xl">{link.icon}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{isAr ? link.name_ar : link.name_en}</p>
                <p className="text-xs text-gray-500">{isAr ? 'تواصل مباشر' : 'Direct chat'}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Form */}
      <div className="card">
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <Check size={32} />
            </div>
            <p className="text-lg font-medium text-gray-700">
              {isAr ? 'تم إرسال رسالتك بنجاح!' : 'Your message has been sent!'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {isAr ? 'سنقوم بمراجعتها والرد عليك في أقرب وقت' : 'We will review and respond as soon as possible'}
            </p>
            <button onClick={() => setSuccess(false)} className="btn-outline mt-4 text-sm">
              {isAr ? 'إرسال رسالة أخرى' : 'Send another'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Type selector */}
            <div>
              <label className="label">{isAr ? 'النوع' : 'Type'}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'complaint' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    form.type === 'complaint'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <AlertCircle size={18} />
                  <span className="text-sm font-medium">{isAr ? 'شكوى' : 'Complaint'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'suggestion' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    form.type === 'suggestion'
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Lightbulb size={18} />
                  <span className="text-sm font-medium">{isAr ? 'اقتراح' : 'Suggestion'}</span>
                </button>
              </div>
            </div>

            {/* Name (optional for guests) */}
            {!user && (
              <div>
                <label className="label">{isAr ? 'الاسم (اختياري)' : 'Name (optional)'}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  maxLength={100}
                  placeholder={isAr ? 'اسمك' : 'Your name'}
                />
              </div>
            )}

            {/* Email (optional for guests) */}
            {!user && (
              <div>
                <label className="label">{isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (optional)'}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  maxLength={100}
                  dir="ltr"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="label">{isAr ? 'الموضوع' : 'Subject'}</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input"
                maxLength={200}
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="label">{isAr ? 'الرسالة' : 'Message'}</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input min-h-[120px] resize-y"
                maxLength={2000}
                required
                placeholder={isAr ? 'اكتب شكواك أو اقتراحك هنا...' : 'Write your complaint or suggestion here...'}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={20} /> : <><Send size={18} /> {isAr ? 'إرسال' : 'Send'}</>}
            </button>

            {!user && (
              <p className="text-xs text-gray-400 text-center">
                {isAr ? 'يمكنك الإرسال بدون تسجيل دخول' : 'You can send without logging in'}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
