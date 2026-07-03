import { useAdStore } from '../../store/adStore'
import { useEffect } from 'react'
import { FileText, Heart, Eye, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const { visitorCount, fetchVisitorCount, settings, fetchSettings } = useAdStore()

  useEffect(() => {
    fetchVisitorCount()
    fetchSettings()
  }, [])

  const whatsapp = settings?.whatsapp_number
  const telegram = settings?.telegram_contact || 'https://t.me/your_telegram_username'

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FileText size={20} className="text-primary-600" />
            <span className="font-medium">CV Builder</span>
            <span className="text-sm text-gray-400">— {new Date().getFullYear()}</span>
          </div>

          {/* Contact icons */}
          <div className="flex items-center gap-3">
            <Link to="/contact" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
              <MessageCircle size={16} /> تواصل معنا
            </Link>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700" title="WhatsApp">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.4.8 3 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3C3.9 14.8 3.5 13.4 3.5 12c0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.8 8-8.5 8zm4.7-6.3c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4-.2 0-.4 0-.6 0-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.3z"/></svg>
              </a>
            )}
            <a href={telegram} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600" title="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 6.8l-1.5 7.1c-.1.5-.4.7-.9.4l-2.5-1.8-1.2 1.2c-.1.1-.3.3-.6.3l.2-2.5 4.7-4.2c.2-.2 0-.3-.3-.1L8.3 13l-2.5-.8c-.5-.2-.5-.5.1-.7l9.7-3.7c.4-.2.8.1.7.6z"/></svg>
            </a>
          </div>

          {/* Visitor counter */}
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <Eye size={14} />
            <span>{visitorCount.toLocaleString()} زيارة</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
