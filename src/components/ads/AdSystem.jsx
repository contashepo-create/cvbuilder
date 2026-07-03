import { useEffect, useState } from 'react'
import { useAdStore } from '../../store/adStore'
import { useAuthStore } from '../../store/authStore'
import { X, ExternalLink } from 'lucide-react'

export default function AdSystem() {
  const { ads, settings, fetchActiveAds, fetchSettings, trackAdView, dismissAd } = useAdStore()
  const { user } = useAuthStore()
  const [dismissedAds, setDismissedAds] = useState([])

  useEffect(() => {
    try {
      fetchActiveAds()
      fetchSettings()
    } catch (e) {
      console.error('Ad fetch failed:', e)
    }
  }, [])

  // Load dismissed ads from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_ads')
    if (stored) setDismissedAds(JSON.parse(stored))
  }, [])

  const handleDismiss = (adId) => {
    const updated = [...dismissedAds, adId]
    setDismissedAds(updated)
    localStorage.setItem('dismissed_ads', JSON.stringify(updated))
    if (user) dismissAd(adId, user.id)
  }

  // Track views once (wrapped to prevent crash)
  useEffect(() => {
    try {
      (ads || []).forEach((ad) => {
        if (!dismissedAds.includes(ad.id)) {
          trackAdView(ad.id, user?.id, user?.email)
        }
      })
    } catch (e) {
      console.error('Ad view tracking failed:', e)
    }
  }, [ads])

  // Filter out dismissed ads (safe defaults)
  const visibleAds = (ads || []).filter(ad => !dismissedAds.includes(ad.id))

  // Separate by type
  const scrollingAds = visibleAds.filter(a => a.type === 'scrolling')
  const bannerAds = visibleAds.filter(a => a.type === 'banner')
  const popupAds = visibleAds.filter(a => a.type === 'popup')

  // Scrolling text from settings (safe access)
  const scrollingText = settings?.scrolling_enabled === 'true'
    ? (document.documentElement.dir === 'rtl' ? settings?.scrolling_text_ar : settings?.scrolling_text_en)
    : ''

  return (
    <>
      {/* Scrolling text bar */}
      {scrollingText && (
        <div className="bg-primary-600 text-white py-1.5 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee whitespace-nowrap px-4">
            {scrollingText}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(100%) }
              100% { transform: translateX(-100%) }
            }
            .animate-marquee {
              animation: marquee 25s linear infinite;
              display: inline-block;
            }
            [dir="rtl"] .animate-marquee {
              animation: marquee 25s linear infinite reverse;
            }
          `}</style>
        </div>
      )}

      {/* Banner ads */}
      {bannerAds.map(ad => (
        <div
          key={ad.id}
          className="relative flex items-center justify-between px-4 py-2.5"
          style={{ backgroundColor: ad.bg_color, color: ad.text_color }}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>{ad.content}</span>
          </div>
          <div className="flex items-center gap-2">
            {ad.link_url && (
              <a
                href={ad.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs underline hover:opacity-80"
                style={{ color: ad.text_color }}
              >
                {ad.link_text || 'Click'} <ExternalLink size={12} />
              </a>
            )}
            <button onClick={() => handleDismiss(ad.id)} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Popup ads */}
      {popupAds.length > 0 && (
        <PopupAd ad={popupAds[0]} onDismiss={handleDismiss} />
      )}
    </>
  )
}

function PopupAd({ ad, onDismiss }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show popup after 2 seconds
    const timer = setTimeout(() => setShow(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShow(false); onDismiss(ad.id) }}>
      <div
        className="rounded-xl max-w-md w-full p-6 relative"
        style={{ backgroundColor: ad.bg_color, color: ad.text_color }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { setShow(false); onDismiss(ad.id) }}
          className="absolute top-3 end-3 opacity-60 hover:opacity-100"
        >
          <X size={20} />
        </button>

        {ad.title && <h3 className="text-lg font-bold mb-2">{ad.title}</h3>}
        {ad.content && <p className="text-sm mb-4 opacity-90">{ad.content}</p>}

        {ad.link_url && (
          <a
            href={ad.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn w-full mb-2"
            style={{ backgroundColor: ad.text_color, color: ad.bg_color }}
          >
            {ad.link_text || 'Learn more'} <ExternalLink size={16} />
          </a>
        )}

        <button
          onClick={() => { setShow(false); onDismiss(ad.id) }}
          className="text-xs opacity-60 hover:opacity-100 w-full text-center mt-2"
        >
          عدم الإظهار مجدداً
        </button>
      </div>
    </div>
  )
}
