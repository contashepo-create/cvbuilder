import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../ui/Spinner'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }) {
  const { user, loading, init } = useAuthStore()

  // If stuck loading for >15s, force stop
  useEffect(() => {
    const timer = setTimeout(() => {
      const state = useAuthStore.getState()
      if (state.loading) {
        useAuthStore.setState({ loading: false })
      }
    }, 15000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Spinner size={40} />
        <p className="text-sm text-gray-400">جاري التحميل...</p>
        <p className="text-xs text-gray-300">إذا استغرق وقتاً طويلاً، تحقق من اتصالك</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}
