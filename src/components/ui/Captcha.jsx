import { useState, useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile Captcha Component
 * Free, privacy-friendly, AI-resistant captcha
 * Docs: https://developers.cloudflare.com/turnstile/
 *
 * Requires VITE_TURNSTILE_SITE_KEY in .env
 * Test keys (always pass): 1x00000000000000000000AA
 * Test keys (always fail): 2x00000000000000000000AB
 */

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

export default function Captcha({ onVerify, theme = 'light' }) {
  const containerRef = useRef(null)
  const [verified, setVerified] = useState(false)
  const [widgetId, setWidgetId] = useState(null)

  useEffect(() => {
    // Load Turnstile script
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    // Render widget when script is loaded
    const tryRender = () => {
      if (window.turnstile && containerRef.current) {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: theme,
          callback: (token) => {
            setVerified(true)
            onVerify(token)
          },
          'error-callback': () => {
            setVerified(false)
            onVerify(null)
          },
          'expired-callback': () => {
            setVerified(false)
            onVerify(null)
          },
        })
        setWidgetId(id)
      } else {
        setTimeout(tryRender, 200)
      }
    }
    tryRender()

    return () => {
      if (widgetId !== null && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [])

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="cf-turnstile"></div>
      {verified && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          ✓ تم التحقق
        </p>
      )}
    </div>
  )
}
