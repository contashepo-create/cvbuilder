import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useAdStore } from '../store/adStore'
import { ArrowLeft, Send, MessageCircle, AlertCircle, Check } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const { user, profile } = useAuthStore()
  const { sendMessage, settings } = useAdStore()
  const isAr = i18n.language === 'ar'

  const [form, setForm] = useState({
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.subject.trim() || !form.message.trim()) {
      setError(isAr ? 'يرجى ملء جميع الحقول' : 'Please fill all fields')
      return
    }
    setLoading(true)
    try {
      await sendMessage({
        user_id: user?.id || null,
        user_email: user?.email || 'guest',
        user_name: profile?.full_name || user?.email || 'Guest',
        subject: form.subject.slice(0, 200),
        message: form.message.slice(0, 2000),
      })
      setSuccess(true)
      setForm({ subject: '', message: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const whatsapp = settings?.whatsapp_number
  const telegram = settings?.telegram_contact || 'https://t.me/your_telegram_username'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isAr ? 'تواصل معنا' : 'Contact Us'}
      </h1>

      {/* Quick contact buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
            className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C3.9 14.8 3.5 13.4 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8-8.5 8zm4.7-6.3c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4-.2 0-.4 0-.6 0-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/></svg>
            </div>
            <div>
              <p className="font-medium text-sm">WhatsApp</p>
              <p className="text-xs text-gray-500">{isAr ? 'تواصل مباشر' : 'Direct chat'}</p>
            </div>
          </a>
        )}
        <a href={telegram} target="_blank" rel="noopener noreferrer"
          className="card flex items-center gap-3 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <MessageCircle size={22} />
          </div>
          <div>
            <p className="font-medium text-sm">Telegram</p>
            <p className="text-xs text-gray-500">{isAr ? 'راسلنا' : 'Message us'}</p>
          </div>
        </a>
      </div>

      {/* Message form */}
      <div className="card">
        <h2 className="font-semibold mb-4">{isAr ? 'أرسل رسالة' : 'Send a Message'}</h2>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <Check size={32} />
            </div>
            <p className="text-lg font-medium text-gray-700">{isAr ? 'تم إرسال رسالتك!' : 'Message sent!'}</p>
            <p className="text-sm text-gray-500 mt-1">{isAr ? 'سنرد عليك في أقرب وقت' : 'We will reply as soon as possible'}</p>
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

            <div>
              <label className="label">{isAr ? 'الرسالة' : 'Message'}</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="input min-h-[120px] resize-y"
                maxLength={2000}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner size={20} /> : <><Send size={18} /> {isAr ? 'إرسال' : 'Send'}</>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
