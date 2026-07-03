import { useAdStore } from '../../store/adStore'
import { useEffect } from 'react'
import { FileText, Eye, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const { visitorCount, fetchVisitorCount, contactLinks, fetchContactLinks } = useAdStore()

  useEffect(() => {
    fetchVisitorCount()
    fetchContactLinks()
  }, [])

  const activeLinks = contactLinks.filter(l => l.is_active)

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <FileText size={20} className="text-primary-600" />
            <span className="font-medium">CV Builder</span>
            <span className="text-sm text-gray-400">— {new Date().getFullYear()}</span>
          </div>

          {/* Contact icons — from database */}
          <div className="flex items-center gap-3">
            <Link to="/contact" className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
              <MessageCircle size={16} /> تواصل معنا
            </Link>
            {activeLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity"
                title={isAr ? link.name_ar : link.name_en}
                style={{ color: link.color }}
              >
                <span className="text-xl">{link.icon}</span>
              </a>
            ))}
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
