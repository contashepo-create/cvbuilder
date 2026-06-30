import { FileText, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText size={20} className="text-primary-600" />
            <span className="font-medium">CV Builder</span>
            <span className="text-sm text-gray-400">— {new Date().getFullYear()}</span>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Made with <Heart size={14} className="text-red-500 fill-red-500" /> for job seekers
          </p>
        </div>
      </div>
    </footer>
  )
}
